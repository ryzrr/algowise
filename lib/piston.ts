// Config for the in-app duel code runner, backed by the free, keyless
// Piston execution API (https://github.com/engineer-man/piston).

export type DuelLanguage = {
  id: string; // stable key used in the UI / localStorage
  label: string;
  monacoLanguage: string;
  pistonLanguage: string; // language id Piston expects
  pistonVersion: string; // "*" = latest available on the public instance
  defaultCode: string;
};

export const DUEL_LANGUAGES: DuelLanguage[] = [
  {
    id: "javascript",
    label: "JavaScript",
    monacoLanguage: "javascript",
    pistonLanguage: "javascript",
    pistonVersion: "*",
    defaultCode: "function solve() {\n  // your code here\n}\n\nconsole.log(solve());\n",
  },
  {
    id: "python",
    label: "Python",
    monacoLanguage: "python",
    pistonLanguage: "python",
    pistonVersion: "*",
    defaultCode: "def solve():\n    # your code here\n    pass\n\nprint(solve())\n",
  },
  {
    id: "typescript",
    label: "TypeScript",
    monacoLanguage: "typescript",
    pistonLanguage: "typescript",
    pistonVersion: "*",
    defaultCode: "function solve(): unknown {\n  // your code here\n}\n\nconsole.log(solve());\n",
  },
  {
    id: "java",
    label: "Java",
    monacoLanguage: "java",
    pistonLanguage: "java",
    pistonVersion: "*",
    defaultCode:
      "public class Main {\n    public static void main(String[] args) {\n        // your code here\n    }\n}\n",
  },
  {
    id: "cpp",
    label: "C++",
    monacoLanguage: "cpp",
    pistonLanguage: "cpp",
    pistonVersion: "*",
    defaultCode:
      "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // your code here\n    return 0;\n}\n",
  },
  {
    id: "c",
    label: "C",
    monacoLanguage: "c",
    pistonLanguage: "c",
    pistonVersion: "*",
    defaultCode: '#include <stdio.h>\n\nint main() {\n    // your code here\n    return 0;\n}\n',
  },
  {
    id: "go",
    label: "Go",
    monacoLanguage: "go",
    pistonLanguage: "go",
    pistonVersion: "*",
    defaultCode: 'package main\n\nimport "fmt"\n\nfunc main() {\n\t// your code here\n\tfmt.Println()\n}\n',
  },
  {
    id: "rust",
    label: "Rust",
    monacoLanguage: "rust",
    pistonVersion: "*",
    pistonLanguage: "rust",
    defaultCode: "fn main() {\n    // your code here\n}\n",
  },
];

export function getDuelLanguage(id: string): DuelLanguage | undefined {
  return DUEL_LANGUAGES.find((lang) => lang.id === id);
}

export const PISTON_EXECUTE_URL = "https://emkc.org/api/v2/piston/execute";

export const MAX_DUEL_CODE_LENGTH = 20_000;
export const MAX_DUEL_STDIN_LENGTH = 4_000;
