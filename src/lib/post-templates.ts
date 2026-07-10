export type PostTemplate = {
  id: string;
  label: string;
  description: string;
  title: string;
  tags: string;
  content: string;
};

export const POST_TEMPLATES: PostTemplate[] = [
  {
    id: "blank",
    label: "空白",
    description: "从零开始",
    title: "",
    tags: "",
    content: "",
  },
  {
    id: "weekly",
    label: "周记",
    description: "本周进展与反思",
    title: "周记 · ",
    tags: "周记",
    content: `## 本周完成

- 

## 问题与阻塞

- 

## 下周计划

- 
`,
  },
  {
    id: "reading",
    label: "读书笔记",
    description: "摘录与感想",
    title: "读《》",
    tags: "读书",
    content: `## 元信息

- 作者：
- 读完日期：

## 核心观点

1. 

## 摘录

> 

## 我的想法

`,
  },
  {
    id: "paper",
    label: "论文笔记",
    description: "HF / arXiv 速记",
    title: "论文：",
    tags: "论文",
    content: `## 链接

- arXiv / HF：

## 一句话

## 方法

## 实验

## 可借鉴点

`,
  },
];

export function getTemplate(id: string): PostTemplate | undefined {
  return POST_TEMPLATES.find((t) => t.id === id);
}
