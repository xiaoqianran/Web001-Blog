/**
 * Knowledge tree helpers (folder + doc order).
 * Pure where possible; FS helpers for local; tree.json schema shared with GitHub.
 */

import fs from "fs";
import path from "path";

export type TreeFolder = {
  id: string; // path id e.g. "notes" | "notes/deep"
  name: string;
  parentId: string | null;
  order: number;
};

export type TreeDoc = {
  slug: string;
  folderId: string | null; // null = root
  order: number;
};

export type ContentTree = {
  version: 1;
  folders: TreeFolder[];
  docs: TreeDoc[];
};

const root = process.cwd();
const treePath = path.join(root, "content/tree.json");
const postsDir = path.join(root, "content/posts");

export function emptyTree(): ContentTree {
  return { version: 1, folders: [], docs: [] };
}

/** Build tree from recursive post relative paths (e.g. notes/a.md). */
export function buildTreeFromRelPaths(relPaths: string[]): ContentTree {
  const tree = emptyTree();
  const folderSet = new Map<string, TreeFolder>();

  const ensureFolder = (folderPath: string) => {
    if (!folderPath || folderSet.has(folderPath)) return;
    const parts = folderPath.split("/");
    let acc = "";
    parts.forEach((part, i) => {
      acc = i === 0 ? part : `${acc}/${part}`;
      if (folderSet.has(acc)) return;
      const parentId = i === 0 ? null : parts.slice(0, i).join("/");
      const node: TreeFolder = {
        id: acc,
        name: part,
        parentId,
        order: folderSet.size,
      };
      folderSet.set(acc, node);
    });
  };

  for (const rel of relPaths) {
    if (!rel.endsWith(".md")) continue;
    if (rel.includes("/trash/")) continue;
    const parts = rel.split("/");
    const file = parts[parts.length - 1]!;
    const slug = file.replace(/\.md$/, "");
    const folderId =
      parts.length > 1 ? parts.slice(0, -1).join("/") : null;
    if (folderId) ensureFolder(folderId);
    tree.docs.push({
      slug,
      folderId,
      order: tree.docs.length,
    });
  }

  tree.folders = Array.from(folderSet.values()).sort((a, b) =>
    a.id.localeCompare(b.id),
  );
  return tree;
}

export function loadTreeFromDisk(): ContentTree {
  if (fs.existsSync(treePath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(treePath, "utf8")) as ContentTree;
      if (raw?.version === 1 && Array.isArray(raw.folders) && Array.isArray(raw.docs)) {
        return raw;
      }
    } catch {
      /* fall through */
    }
  }
  // rebuild from posts
  if (!fs.existsSync(postsDir)) return emptyTree();
  const rels: string[] = [];
  const walk = (dir: string, prefix: string) => {
    for (const name of fs.readdirSync(dir)) {
      if (name === "trash" || name.startsWith(".")) continue;
      const full = path.join(dir, name);
      const st = fs.statSync(full);
      const rel = prefix ? `${prefix}/${name}` : name;
      if (st.isDirectory()) walk(full, rel);
      else if (name.endsWith(".md")) rels.push(rel.replace(/\\/g, "/"));
    }
  };
  walk(postsDir, "");
  return buildTreeFromRelPaths(rels);
}

export function saveTreeToDisk(tree: ContentTree): void {
  fs.mkdirSync(path.dirname(treePath), { recursive: true });
  fs.writeFileSync(treePath, `${JSON.stringify(tree, null, 2)}\n`, "utf8");
}

export function getFolderChildren(
  tree: ContentTree,
  parentId: string | null,
): TreeFolder[] {
  return tree.folders
    .filter((f) => f.parentId === parentId)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

export function getDocsInFolder(
  tree: ContentTree,
  folderId: string | null,
): TreeDoc[] {
  return tree.docs
    .filter((d) => d.folderId === folderId)
    .sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
}

/** Breadcrumb folder segments for a folderId */
export function folderBreadcrumb(
  tree: ContentTree,
  folderId: string | null,
): { id: string; name: string }[] {
  if (!folderId) return [];
  const byId = new Map(tree.folders.map((f) => [f.id, f]));
  const chain: { id: string; name: string }[] = [];
  let cur: string | null = folderId;
  while (cur) {
    const f = byId.get(cur);
    if (!f) break;
    chain.unshift({ id: f.id, name: f.name });
    cur = f.parentId;
  }
  return chain;
}

export function getDocFolderId(tree: ContentTree, slug: string): string | null {
  return tree.docs.find((d) => d.slug === slug)?.folderId ?? null;
}

/** Flat published order for prev/next */
export function flattenDocOrder(tree: ContentTree): string[] {
  const out: string[] = [];
  const walk = (parentId: string | null) => {
    for (const f of getFolderChildren(tree, parentId)) walk(f.id);
    for (const d of getDocsInFolder(tree, parentId)) out.push(d.slug);
  };
  walk(null);
  return out;
}

export function ensureDocInTree(
  tree: ContentTree,
  slug: string,
  folderId: string | null,
): ContentTree {
  const docs = tree.docs.filter((d) => d.slug !== slug);
  const siblings = docs.filter((d) => d.folderId === folderId);
  const order =
    siblings.length === 0
      ? 0
      : Math.max(...siblings.map((d) => d.order)) + 1;
  docs.push({ slug, folderId, order });
  return { ...tree, docs };
}

export function moveDocInTree(
  tree: ContentTree,
  slug: string,
  folderId: string | null,
): ContentTree {
  return ensureDocInTree(tree, slug, folderId);
}

export function addFolderToTree(
  tree: ContentTree,
  name: string,
  parentId: string | null,
): ContentTree {
  const safe = name
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9\u4e00-\u9fff-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "folder";
  const id = parentId ? `${parentId}/${safe}` : safe;
  if (tree.folders.some((f) => f.id === id)) {
    throw new Error("文件夹已存在");
  }
  const siblings = getFolderChildren(tree, parentId);
  const order =
    siblings.length === 0 ? 0 : Math.max(...siblings.map((f) => f.order)) + 1;
  return {
    ...tree,
    folders: [
      ...tree.folders,
      { id, name: name.trim() || safe, parentId, order },
    ],
  };
}

export function renameFolderInTree(
  tree: ContentTree,
  folderId: string,
  name: string,
): ContentTree {
  return {
    ...tree,
    folders: tree.folders.map((f) =>
      f.id === folderId ? { ...f, name: name.trim() || f.name } : f,
    ),
  };
}

export function deleteFolderFromTree(
  tree: ContentTree,
  folderId: string,
): ContentTree {
  const hasKids = tree.folders.some((f) => f.parentId === folderId);
  const hasDocs = tree.docs.some((d) => d.folderId === folderId);
  if (hasKids || hasDocs) {
    throw new Error("只能删除空文件夹");
  }
  return {
    ...tree,
    folders: tree.folders.filter((f) => f.id !== folderId),
  };
}

export function reorderDoc(
  tree: ContentTree,
  slug: string,
  direction: "up" | "down",
): ContentTree {
  const doc = tree.docs.find((d) => d.slug === slug);
  if (!doc) return tree;
  const siblings = getDocsInFolder(tree, doc.folderId);
  const idx = siblings.findIndex((d) => d.slug === slug);
  const swapWith = direction === "up" ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= siblings.length) return tree;
  const a = siblings[idx]!;
  const b = siblings[swapWith]!;
  const orderA = a.order;
  const orderB = b.order;
  return {
    ...tree,
    docs: tree.docs.map((d) => {
      if (d.slug === a.slug) return { ...d, order: orderB };
      if (d.slug === b.slug) return { ...d, order: orderA };
      return d;
    }),
  };
}
