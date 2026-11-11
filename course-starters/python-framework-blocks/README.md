# 从底层积木拼出框架

Python 3.10 或更高版本，无第三方依赖，不访问真实接口或数据库。

## 一块一块运行

先运行 python3 examples/01_values.py，按编号逐个运行 examples 中的八个文件。每份例子完整可运行，使用同一个库存主题。最后运行 python3 runner.py，从旁边的 flow.json 读取两步流程。

## 自己修改

exercises 是尚未完成的练习。每次只完成一项，再运行 python3 verify.py --block 1（把数字换成当前积木编号）。

验证器会运行 exercises 中对应文件，检查退出状态和输出。第 7 项故意触发 AssertionError，只有确认该异常与“收尾”输出才算通过。不要用 python -O 运行本练习，优化模式会跳过 assert。

solutions 提供参考修改，仅在自己完成后查看。python3 verify.py --block 1 --reference 只检查参考实现。

网页草稿不会自动写到本目录。先在 exercises 文件里保存自己的代码，再执行验证；通过本机课程连接器运行时，退出码和日志会回传当前网页。

## 在 VS Code 中调试

本项目已经提供 .vscode/launch.json 和 tasks.json。按 F5 可选择积木编号并调试 verify.py；运行默认测试任务也会提示选择 1-8。断点可以放在 exercises 对应文件或 verify.py 中。

## 验证小框架

python3 -m unittest discover -s tests -v 检查 Runner 的正常链路、两次运行隔离、错误动作、错误预期、库存不足和失败时收尾。

这个小框架只演示普通函数如何组合。finally 中打印“收尾”不等于完成真实清理；没有验证数据库回滚、HTTP、并发或生产系统。输入结构校验、持久化和真实资源释放是后续主题。
