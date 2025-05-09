# HBnote - 简洁的桌面记录应用

HBnote 是一个使用 Electron+React 开发的轻量级桌面应用，提供笔记记录、待办事项管理和截止日期提醒功能，界面简洁直观。

## 功能特点

- 📝 笔记管理

  - 快速创建带标题和内容的笔记
  - 编辑和删除已有笔记
  - 使用时间戳记录创建/修改时间
  - 删除确认对话框防止误操作

- ✅ 待办事项

  - 简洁的待办事项添加界面
  - 标记完成/未完成状态
  - 一键删除功能（带确认框）
  - 显示创建日期

- ⏰ 截止日期提醒 (DDL)

  - 创建带标题和内容的截止事项
  - 精确设置截止日期和时间
  - 可选的提前提醒功能（5 分钟至 1 天）
  - 实时显示剩余时间倒计时
  - 基于截止时间的状态显示（正常/即将截止/已过期）
  - 桌面通知提醒功能

- 🎨 界面设计

  - 无边框透明窗口
  - Material UI 界面组件
  - 自定义标题栏控制按钮
  - 支持窗口拖动、最小化、最大化和关闭

- 💾 数据管理
  - 本地数据持久化存储
  - 自动保存机制

## 技术栈

- **前端**: React 19, Material UI
- **后端**: Electron 36
- **构建工具**: Vite 6
- **包管理**: Yarn
- **数据存储**: Electron Store

## 开发环境设置

1. 确保已安装 [Node.js](https://nodejs.org/) (v16+) 和 [Yarn](https://yarnpkg.com/)

2. 克隆仓库并安装依赖：

   ```bash
   git clone <仓库地址>
   cd hbnote
   yarn install
   ```

3. 开发模式启动：

   ```bash
   # 启动前端开发服务器
   yarn dev

   # 另一个终端启动Electron应用
   yarn start
   ```

## 构建应用

构建生产版本：

```bash
# 构建前端资源
yarn build
# 也可以使用yarn vite build
# 启动应用
yarn start
```

也可以直接下载安装包开盖即用。

## 项目结构

```
hbnote/
├── main.js           # Electron主进程
├── preload.js        # 预加载脚本（上下文桥接）
├── index.html        # HTML入口
├── src/              # React源代码
│   ├── index.jsx     # React入口
│   ├── App.jsx       # 主应用组件
│   └── components/   # 组件目录
│       ├── Notes.jsx           # 笔记组件
│       ├── NoteItem.jsx        # 笔记项组件
│       ├── TodoList.jsx        # 待办事项组件
│       ├── TodoItem.jsx        # 待办事项项组件
│       ├── DDL.jsx             # 截止日期组件
│       ├── DDLItem.jsx         # 截止日期项组件
│       └── mui_local_icons/    # 本地图标组件
├── dist/             # 构建输出目录
└── package.json      # 项目依赖和脚本
```

## 数据存储

应用数据使用 Electron Store 保存在用户目录，默认位置：

- Windows: `%APPDATA%\hbnote\hbnote-data.json`

## 注意事项

1. 首次运行需要安装全部依赖
2. 窗口可通过拖动任意位置移动
3. 所有删除操作均有确认对话框防止误操作
4. DDL 提醒功能需要应用处于运行状态才能触发，首次使用时需授予浏览器通知权限
5. 项目使用自定义的本地图标组件替代外部图标库，降低依赖复杂度
