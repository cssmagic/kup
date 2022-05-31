# Kup

> A CLI tool to sync local Markdown files to GitHub issues.
>
> 这款命令行工具可以把本地 Markdown 文件同步到 GitHub issue。

![Kup logo](https://user-images.githubusercontent.com/1231359/171189409-4469e2d4-9ff1-4b6b-8a73-d95d3434a5c6.png)

## 谁需要它

* 利用 GitHub issue 写博客的作者们，可以方便地在本地编辑原稿，并随时发布新博文或更新已有博文。
* 通过 GitHub issue 发布文档的开源软件作者们，可以把代码仓库中的文档更新到指定 issue。
* 其它需要频繁更新 GitHub issue 的人。


## 安装

需要全局安装，以便随时在命令行调用：

```sh
npm i -g kup-cli
```

（当 Kup 发布新版时，可以再次运行这行命令升级已安装的版本。）


## 使用方法

### 发布新 issue

```sh
kup ./path/to/file.md --repo foo/bar
```

Kup 会把 `file.md` 文件的内容发布为 `foo/bar` 仓库的一个新 issue，发布成功后会告知新 issue 的编号。

### 更新已有 issue

```sh
kup ./path/to/file.md --repo foo/bar --id 123
```

Kup 会把 `file.md` 文件的内容更新到 `foo/bar` 仓库的编号为 `123` 的 issue。

### 准备工作

操作 GitHub issue 是需要权限认证的，因此你需要向 Kup 提供 GitHub token，以便 Kup 调用 GitHub API。

1. 进入 [此页面](https://github.com/settings/tokens) 申请 “Personal access tokens”，权限范围需要选中 “repo”。

	> 友情提示：不要把 token 告诉其他人；不要把 token 写进代码。

2. 把获取到的 token 写入环境变量：

	```sh
	export GITHUB_TOKEN=ghp_**********
	```

如果 Kup 未能从环境变量获取 token，会在命令行向你询问。


## 命令行参数

参数 | 短名 | 值类型 | 含义 | 备注
---|---|---|---|---
`--repo` | `-r` | 字符串 | 指定 GitHub 仓库
`--id` | `-i` | 整数 | 指定 issue 的编号 | <li>指定编号表示更新已有 issue<li>未指定编号则表示发布新 issue
`--version` | `-v` | - | 显示版本号
`--help` | `-h` | - | 显示帮助信息


## 进阶

### 如何更方便地指定 `repo` 参数？

有以下方式可以指定 `repo` 参数，优先级递减：

1. 调用命令行时指定的 `--repo` 参数。
1. Markdown 文件内的 [元数据](https://github.com/cssmagic/kup/issues/1) 的 `repo` 字段。
1. 当前项目的 `package.json` 文件内的 `kup.repo` 字段。Kup 会从当前目录向上逐级寻找 `package.json` 文件。

如果整个项目的同步目标都是同一个仓库，则可以采用最后一种方式统一指定 `repo` 参数。

### 如何更方便地指定 `id` 参数？

有以下方式可以指定 `id` 参数，优先级递减：

1. 调用命令行时指定的 `--id` 参数。
1. Markdown 文件内的元数据的 `id` 字段。

当一个文件发布成功后，建议立即把 id 写入它的元数据。

### Issue 的标题是怎么确定的？

Kup 通过以下线索来确定 issue 的标题，优先级递减：

1. Markdown 文件内的元数据的 `title` 字段。
1. Markdown 正文的第一个标记如果是一级标题（`# Title` 格式），则取它的内容。

如果通过以上方式无法确定 issue 标题，Kup 会怎么处理？

* 如果是在发布新 issue，则 Kup 会自己生成一个标题。
* 如果是在更新已有 issue，则 Kup 会忽略标题（也就是说，不会修改已有标题）。

### 如何为 issue 指定 label？

不论是在写博客，还是在发表 issue，你常常都会有打标签的需求。于是 Kup 也实现了这个功能。

你需要在 Markdown 文件的元数据中添加 `tags` 字段，指定一个或多个 label。这些 label 不需要事先在 GitHub 仓库里创建好——如果你指定了不存在的 label，会在发布 issue 时自动创建。

如果元数据中没有 `tags` 字段，Kup 会怎么处理？

* 如果是在发布新 issue，则 Kup 不会为 issue 设置任何 label。
* 如果是在更新已有 issue 时，Kup 会忽略标签（也就是说，不会修改已有标签）。

在更新已有 issue 时，如果元数据指定的标签与 issue 现有标签不一致，则前者会完全替代后者。

## 文档

* [Markdown 文件内的元数据示例](https://github.com/cssmagic/kup/issues/1)


## 其它

### 开发计划

请参考 [本项目的 issue](https://github.com/cssmagic/kup/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc)。欢迎提出你的需求，或参与 RFC 讨论。

### 关于名字

* Kup 取自 “皮卡” 的英文词 pickup，喻意是 “轻便地运载”。
* Kup 是变形金刚人物 “杯子” 的英文名。

### 关于 Logo

* 作者 [Fasil](https://freeicons.io/profile/722)，由 [freeicons.io](https://freeicons.io/free-icons-pack/pickup-truck-icon-26893) 免费提供。

***

## License

MIT
