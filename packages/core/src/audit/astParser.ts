import ts from "typescript";
import fs from "fs/promises";
import path from "path";

export interface ImportInfo {
  source: string;
  named: string[];
  namespace: string | null;
  isTypeOnly: boolean;
  isDefault: boolean;
  line: number;
  column: number;
}

export interface ExportInfo {
  name: string;
  isDefault: boolean;
  isType: boolean;
  line: number;
}

export class TypeScriptASTParser {
  private compilerOptions: ts.CompilerOptions;

  constructor(tsConfigPath: string) {
    const tsConfig = JSON.parse(
      require("fs").readFileSync(tsConfigPath, "utf8")
    );
    this.compilerOptions = tsConfig.compilerOptions;
  }

  async parseImports(filePath: string): Promise<ImportInfo[]> {
    const content = await fs.readFile(filePath, "utf8");
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    const imports: ImportInfo[] = [];

    const visit = (node: ts.Node) => {
      if (ts.isImportDeclaration(node)) {
        const importInfo = this.parseImportNode(node, sourceFile);
        imports.push(importInfo);
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return imports;
  }

  private parseImportNode(
    node: ts.ImportDeclaration,
    sourceFile: ts.SourceFile
  ): ImportInfo {
    const moduleSpecifier = (node.moduleSpecifier as ts.StringLiteral).text;
    const importClause = node.importClause;
    const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());

    let named: string[] = [];
    let namespace: string | null = null;
    let isDefault = false;

    if (importClause) {
      if (importClause.name) {
        isDefault = true;
      }

      if (importClause.namedBindings) {
        if (ts.isNamespaceImport(importClause.namedBindings)) {
          namespace = importClause.namedBindings.name.text;
        } else if (ts.isNamedImports(importClause.namedBindings)) {
          named = importClause.namedBindings.elements
            .map((e) => e.propertyName?.text || e.name.text)
            .filter(Boolean);
        }
      }
    }

    return {
      source: moduleSpecifier,
      named,
      namespace: namespace,
      isTypeOnly: importClause?.isTypeOnly ?? false,
      isDefault,
      line: 1,
      column: 0,
    };
  }

  async parseExports(filePath: string): Promise<ExportInfo[]> {
    const content = await fs.readFile(filePath, "utf8");
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    const exports: ExportInfo[] = [];

    const visit = (node: ts.Node) => {
      if (ts.isExportDeclaration(node)) {
        // export { a, b }
        if (node.exportClause && ts.isNamedExports(node.exportClause)) {
          node.exportClause.elements.forEach((element) => {
            exports.push({
              name: element.propertyName?.text || element.name.text,
              isDefault: false,
              isType: node.isTypeOnly ?? false,
              line:
                sourceFile.getLineAndCharacterOfPosition(node.getStart()).line +
                1,
            });
          });
        }
      } else if (ts.isExportAssignment(node)) {
        // export default ...
        exports.push({
          name: "default",
          isDefault: true,
          isType: false,
          line:
            sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
        });
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return exports;
  }

  resolvePathAlias(importPath: string, baseDir: string): string {
    const paths = this.compilerOptions.paths || {};

    for (const [alias, targets] of Object.entries(paths)) {
      const aliasPattern = alias.replace("*", "(.+)");
      const regex = new RegExp(`^${aliasPattern}$`);
      const match = importPath.match(regex);

      if (match && targets.length > 0) {
        const target = targets[0].replace("*", match[1]);
        return path.resolve(baseDir, target).replace(/\\/g, "/");
      }
    }

    return path.resolve(baseDir, importPath).replace(/\\/g, "/");
  }
}
