# 可访问性检查清单（主路径）

## 交互控件

- 所有按钮、图标按钮具备可读 `aria-label`
- 选中态控件使用 `aria-pressed` 或 `aria-selected`
- Tab 结构具备 `tablist/tab/tabpanel` 语义

## 键盘可达

- 可通过键盘完成筛选、切 tab、评论提交
- 所有可聚焦元素有 `focus-visible` 样式
- 弹层支持 `Esc` 关闭

## 状态反馈

- 失败提示使用 `role="alert"`（或等效语义）
- 加载/禁用态可视且可读（文本或属性）
- 空状态提供明确恢复动作
