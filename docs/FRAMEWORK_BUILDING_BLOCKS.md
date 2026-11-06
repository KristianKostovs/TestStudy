# Python 框架积木复盘

直接阅读：[从底层积木到完整框架的逐步讲解](PYTHON_FRAMEWORK_BUILDING_BLOCKS_GUIDE.md)。

面向已学完框架基础、仍觉得抽象的学习者，在 Python 框架基础中新增独立复盘入口：

`/courses/python-framework/building-blocks`

保持原课程、通关记录、评分与笔记。复盘过程可自由查看，不通过阅读或浏览步骤写入原课程完成状态。编辑草稿使用独立的 python-framework-blocks 键空间。

## 讲解顺序

普通计算 → 函数 → 断言 → 多组数据 → 动作表 → 上下文 → 失败收尾 → 文件驱动的 Runner。

始终使用库存 10、减少 2、增加 5 的例子。前半段独立测试数据与后半段连续步骤明确区分：独立测试从各自给定库存开始；连续步骤使用上一结果。

每块积木展示遇到的问题、增加的做法、必要语法、值的流动、可独立运行的完整代码、一次小修改与客观验收。新增代码行突出显示，解释贴着代码。学完之后再对应 Runner、Context、Registry、pytest、fixture、YAML、Adapter 和 HTTPX。

## 可运行包

`node scripts/package-framework-blocks.mjs` 从课程数据生成 `public/downloads/python-framework-blocks.zip`。包内含八份完整例子、八项待完成练习、参考修改、flow.json、最终 Runner 和测试。

- `python3 examples/01_values.py`：逐个运行例子。
- `python3 verify.py --block 1`：运行自己的对应练习。
- `python3 verify.py --block 1 --reference`：只验证参考修改。
- 第 7 项故意抛 AssertionError，验证器同时检查异常类型、非零退出和收尾输出。
- `python3 -m unittest discover -s tests -v`：检查 Runner 的数据传递、输入不变、运行隔离、错误动作、库存不足、错误预期与收尾行为。

示例使用 assert 说明测试检查，不以 assert 替代生产输入校验；不要在 Python 优化模式下运行这些练习。finally 里的打印只是观察执行顺序，不证明真实清理和数据库回滚。小框架尚未包含真实 HTTP、并发、输入 Schema、复杂清理与持久化。网页不执行 Python，日志尚未自动回传通关状态。
