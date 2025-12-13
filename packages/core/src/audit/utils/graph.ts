export interface DependencyGraph {
  nodes: Set<string>;
  edges: Map<string, Set<string>>;
}

export interface Cycle {
  nodes: string[];
  edges: Array<[string, string]>;
}

export class DependencyGraphAnalyzer {
  private graph: DependencyGraph;

  constructor(graph: DependencyGraph) {
    this.graph = graph;
  }

  /**
   * Detecta ciclos usando DFS (Tarjan's algorithm)
   */
  detectCycles(): Cycle[] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: Cycle[] = [];
    const path: string[] = [];

    const dfs = (node: string): void => {
      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      const neighbors = this.graph.edges.get(node) || new Set();

      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor);
        } else if (recursionStack.has(neighbor)) {
          // Ciclo encontrado
          const cycleStart = path.indexOf(neighbor);
          const cycleNodes = path.slice(cycleStart);
          const cycleEdges = this.extractEdges(cycleNodes);

          cycles.push({
            nodes: cycleNodes,
            edges: cycleEdges,
          });
        }
      }

      path.pop();
      recursionStack.delete(node);
    };

    for (const node of this.graph.nodes) {
      if (!visited.has(node)) {
        dfs(node);
      }
    }

    return cycles;
  }

  private extractEdges(nodes: string[]): Array<[string, string]> {
    const edges: Array<[string, string]> = [];
    for (let i = 0; i < nodes.length; i++) {
      const from = nodes[i];
      const to = nodes[(i + 1) % nodes.length];
      edges.push([from, to]);
    }
    return edges;
  }

  /**
   * Calcula score de complexidade (mais ciclos = mais complexo)
   */
  getComplexityScore(): number {
    const cycles = this.detectCycles();
    return cycles.reduce((score, cycle) => score + cycle.nodes.length, 0);
  }

  /**
   * Retorna componentes fortemente conectados (SCCs)
   */
  findStronglyConnectedComponents(): string[][] {
    const sccs: string[][] = [];
    const visited = new Set<string>();
    const stack: string[] = [];

    // Primeira DFS para preencher stack
    const dfs1 = (node: string): void => {
      visited.add(node);
      const neighbors = this.graph.edges.get(node) || new Set();
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs1(neighbor);
        }
      }
      stack.push(node);
    };

    for (const node of this.graph.nodes) {
      if (!visited.has(node)) {
        dfs1(node);
      }
    }

    // Segunda DFS no grafo transposto
    visited.clear();
    const reverseGraph = this.transposeGraph();

    while (stack.length > 0) {
      const node = stack.pop()!;
      if (!visited.has(node)) {
        const scc: string[] = [];
        const dfs2 = (n: string): void => {
          visited.add(n);
          scc.push(n);
          const neighbors = reverseGraph.edges.get(n) || new Set();
          for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
              dfs2(neighbor);
            }
          }
        };
        dfs2(node);
        if (scc.length > 1) {
          sccs.push(scc);
        }
      }
    }

    return sccs;
  }

  private transposeGraph(): DependencyGraph {
    const reversed: DependencyGraph = {
      nodes: new Set(this.graph.nodes),
      edges: new Map(),
    };

    for (const [from, tos] of this.graph.edges) {
      for (const to of tos) {
        if (!reversed.edges.has(to)) {
          reversed.edges.set(to, new Set());
        }
        reversed.edges.get(to)!.add(from);
      }
    }

    return reversed;
  }
}
