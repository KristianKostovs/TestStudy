#!/bin/zsh
set -u

quest_dir="${0:A:h}"
cd "$quest_dir" || exit 1

echo "测试能力成长平台 · 一键提交并发布"
echo "请输入这次更新的简短说明，然后按回车。"
read "publish_message?> "

if [[ -z "${publish_message// /}" ]]; then
  publish_message="更新学习平台内容"
fi

npm run publish:site -- "$publish_message"
publish_status=$?

if [[ $publish_status -eq 0 ]]; then
  echo "完成。按回车关闭窗口。"
else
  echo "没有完成发布；上方已保留具体原因。按回车关闭窗口。"
fi
read
exit $publish_status
