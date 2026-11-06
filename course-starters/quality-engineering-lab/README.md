# 质量工程离线练习包

Python 3.10 或更高版本，无第三方依赖，无网络、真实数据库或内部系统访问。

## 开始练习

在本目录运行 `python3 run_tests.py`。初始版本会因五个 TODO 尚未实现而失败，这是练习起点。修改 `src/lab.py` 后重复运行。仅想运行一个任务可使用 `python3 run_tests.py --task summary`；任务名还包括 inventory、classification、gate、metrics。

命令退出码 0 表示所选测试通过，非 0 表示失败。保存测试输出、代码版本和新增反例作为运行证据。网页中的编辑器草稿不会自动写入本目录，也不会自动登记这些运行结果为通关。

## 五项固定契约

1. **summary**：输入记录包含布尔 success；失败记录必须有非空字符串 error_code。统计各错误码数量，成功记录忽略，空输入返回空字典。不修改输入，非法记录抛 ValueError。
2. **inventory**：Inventory 初始库存为非负整数；apply(event_id, amount) 的 amount 为非零整数增减量。结果小于零时失败且不修改状态。同事件同载荷返回首次结果、只更新一次；同事件不同载荷拒绝。event_id 为非空字符串。布尔值不视为整数。
3. **classification**：transport_error 非空优先归 transport；HTTP 401/403 为 auth；其余非 2xx 为 http；2xx 下 success=false 为 business、true 为 ok，缺少明确结果为 unknown。
4. **gate**：关键失败数为非负整数；大于零返回 block，否则证据完整返回 pass，证据不完整返回 review。非法输入抛 ValueError。
5. **metrics**：真实和预测标签长度相等；按指定 positive 类计算 tp、fp、fn、precision、recall。分母为零返回 None，长度不同抛 ValueError。这里不自动计算弃权率；学员可自行扩展。

库存实现是单进程、顺序执行的内存练习。它不证明数据库并发、跨进程幂等、崩溃恢复或生产系统正确。数据库与分布式练习需要另外设计唯一约束、事务和实际故障实验。

## 参考实现与交付

先完成练习再查看 `solutions/lab.py`。运行 `python3 run_tests.py --reference` 只校验参考实现，不代表自己的代码通过。

交付实现、至少一个新增反例、失败到修复的日志和一页技术说明。CI 样例在 `ci/quality.yml`，如要用于自己的 GitHub 仓库，将其放到 `.github/workflows/quality.yml`。示例只提供本地练习验证，没有执行远程 CI。
