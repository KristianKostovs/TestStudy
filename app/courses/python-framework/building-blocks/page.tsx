import type { Metadata } from "next";
import FrameworkBlocksClient from "./FrameworkBlocksClient";

export const metadata: Metadata = {
  title: "Python 框架课前积木 | Python 框架基础",
  description: "正式框架课程前的预备桥梁：用同一个库存例子，从普通计算、函数和断言，逐步拼成带动作表、上下文、收尾与证据的小型 Runner。",
};

export default function FrameworkBlocksPage() {
  return <FrameworkBlocksClient />;
}
