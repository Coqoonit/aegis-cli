import { defineCommand, type CommandDef } from "citty";
import { ValidationError } from "../lib/errors.js";
import { handleError } from "../lib/output.js";

type MainFactory = () => CommandDef;

interface DomainMap {
  [domain: string]: {
    description: string;
    subcommands: string[];
  };
}

function collectDomains(root: CommandDef): DomainMap {
  const out: DomainMap = {};
  const sub = root.subCommands;
  if (!sub) return out;

  for (const [name, rawCmd] of Object.entries(sub)) {
    if (typeof rawCmd === "function") continue;
    const cmd = rawCmd as CommandDef;
    const description =
      (cmd.meta as { description?: string } | undefined)?.description ?? "";
    const subcommands: string[] = [];

    if (cmd.subCommands) {
      for (const [subName, rawSub] of Object.entries(cmd.subCommands)) {
        if (typeof rawSub === "function") continue;
        subcommands.push(subName);
      }
    }

    out[name] = { description, subcommands };
  }
  return out;
}

function emitBash(domains: DomainMap): string {
  const topLevel = Object.keys(domains).join(" ");
  const cases = Object.entries(domains)
    .filter(([, v]) => v.subcommands.length > 0)
    .map(
      ([domain, v]) =>
        `    ${domain}) COMPREPLY=($(compgen -W "${v.subcommands.join(" ")}" -- "$cur")) ;;`,
    )
    .join("\n");

  return `# bash completion for aegis
# Source this file or put it under /etc/bash_completion.d/
_aegis_complete() {
  local cur prev
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"

  if [[ $COMP_CWORD -eq 1 ]]; then
    COMPREPLY=($(compgen -W "${topLevel}" -- "$cur"))
    return
  fi

  case "\${COMP_WORDS[1]}" in
${cases}
  esac
}

complete -F _aegis_complete aegis
`;
}

function emitZsh(domains: DomainMap): string {
  const topLevel = Object.entries(domains)
    .map(
      ([domain, v]) =>
        `    '${domain}:${v.description.replace(/'/g, "'\\''").slice(0, 80)}'`,
    )
    .join("\n");

  const cases = Object.entries(domains)
    .filter(([, v]) => v.subcommands.length > 0)
    .map(
      ([domain, v]) =>
        `      ${domain}) _values '${domain} subcommand' ${v.subcommands.map((s) => `'${s}'`).join(" ")} ;;`,
    )
    .join("\n");

  return `#compdef aegis
# zsh completion for aegis
# Put this file in a directory in $fpath (e.g. ~/.zsh/completions/_aegis)
# and add \`fpath=(~/.zsh/completions $fpath)\` to .zshrc before compinit.

_aegis() {
  local -a commands
  commands=(
${topLevel}
  )

  if (( CURRENT == 2 )); then
    _describe 'command' commands
    return
  fi

  if (( CURRENT == 3 )); then
    case "\${words[2]}" in
${cases}
    esac
    return
  fi
}

compdef _aegis aegis
`;
}

export function defineCompletionsCommand(mainFactory: MainFactory) {
  return defineCommand({
    meta: {
      name: "completions",
      description:
        "Generate shell completion scripts for aegis commands (subcommand-level only, no flag completion). Usage: `aegis completions zsh > ~/.zsh/completions/_aegis`.",
    },
    args: {
      shell: {
        type: "positional",
        required: true,
        description: "zsh | bash",
      },
    },
    async run({ args }) {
      try {
        const shell = args.shell;
        if (shell !== "zsh" && shell !== "bash") {
          throw new ValidationError(
            `Invalid shell: ${shell}. Expected zsh | bash.`,
          );
        }
        const domains = collectDomains(mainFactory());
        // Skip meta commands themselves from the subcommand list
        delete domains.completions;

        const script =
          shell === "bash" ? emitBash(domains) : emitZsh(domains);
        process.stdout.write(script);
      } catch (err) {
        handleError(err);
      }
    },
  });
}

