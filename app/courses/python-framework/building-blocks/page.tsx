import type { Metadata } from "next";
import FrameworkBlocksClient from "./FrameworkBlocksClient";

export const metadata: Metadata = {
  title: "从底层积木拼出框架 | Python 框架基础",
  description: "用同一个库存例子，从普通计算、函数和断言，逐步拼成带动作表、上下文、收尾与证据的小型 Runner。",
};

export default function FrameworkBlocksPage() {
  return <FrameworkBlocksClient />;
}
