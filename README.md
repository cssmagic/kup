English | [中文](README.zh.md)

# Kup

<img src="https://user-images.githubusercontent.com/1231359/171321963-e8e73bdf-f9c8-435b-9707-318e92f1805a.png" width="150" height="80" align="right" alt="Kup logo">

> A CLI tool to sync local Markdown files and GitHub issues bidirectionally.
>
> 一款命令行工具，实现本地 Markdown 文件与 GitHub Issues 的双向同步。



## Who Is It For

* Bloggers who publish with GitHub issues and want to edit drafts locally.
* Open-source authors who publish documentation through GitHub issues.
* Anyone else who needs to update GitHub issues frequently.



## Installation

```sh
npm install -g kup-cli
```

Install it globally so you can use it anytime, anywhere from the command line. (When a new version of Kup is released, run the same command again to upgrade.)



## Usage

### Publish a New Issue

```sh
kup ./path/to/file.md --repo foo/bar
```

Kup will publish the content of `file.md` as a new issue in the `foo/bar` repository, and report the new issue number after it succeeds.

### Update an Existing Issue

```sh
kup ./path/to/file.md --repo foo/bar --id 123
```

Kup will update issue `123` in the `foo/bar` repository with the content of `file.md`.

### Dump an Existing Issue

```sh
kup --dump --repo foo/bar --id 123
```

Kup will dump issue `123` from the `foo/bar` repository to `123.md` in the current directory.

If you want to specify the output file, you can also use:

```sh
kup ./path/to/file.md --dump --repo foo/bar --id 123
```

### Preparation

Updating GitHub issues requires authentication, so you need to provide a GitHub token for Kup to call the GitHub API.

1. Create a new token on GitHub's "[Personal access tokens](https://github.com/settings/tokens)" page, and make sure the `repo` scope is selected. (See [this document](https://github.com/cssmagic/kup/issues/17) for details.)

2. Put the token into an environment variable:

   ```sh
   export GITHUB_TOKEN=ghp_**********
   ```

If Kup cannot read a token from the environment, it will prompt you for one in the terminal.



## Command-Line Options

Option | Short | Value Type | Description
---|---|---|---
`--repo` | `-r` | string | Specify the GitHub repository
`--id` | `-i` | integer | Specify the issue number: <ul><li>Providing a number means updating an existing issue<li>Omitting it means publishing a new issue</ul>
`--dump` | `-d` | - | Enable dump mode, save a GitHub issue as a local Markdown file
`--version` | `-v` | - | Show the version number
`--help` | `-h` | - | Show help information



### &nbsp;

> ***
>
> ### **🙋‍♂️ Open to Work (Remote, Global)**
>
> * Senior Fullstack Engineer · Node.js, React, Vue, TS · 10+ years
> * Published author on “AI Coding” · GitHub 3k+ followers
> * → Resume / Contact: https://github.com/cssmagic/Footprint
>
> ***

### &nbsp;



## Advanced

### How can I specify the `repo` option more conveniently?

Kup can determine the `repo` option in the following order of priority:

1. The `--repo` option passed on the command line.
1. The `repo` field in the Markdown file's [metadata](https://github.com/cssmagic/kup/issues/1).
1. The `kup.repo` field in the current project's `package.json`. Kup starts from the Markdown file's directory and searches upward for a `package.json` file.
1. If `kup.repo` is not present in `package.json`, Kup will try to infer the repository name from the `repository` field and ask for confirmation before using it.
1. If that still fails, Kup will continue searching for `.git/config` in the current or parent directories, then try to infer the repository name from the `url` field of `remote "origin"` and ask for confirmation before using it.

If the entire project syncs to the same repository, it is usually best to configure `kup.repo` in `package.json`.

### How can I specify the `id` option more conveniently?

Kup can determine the `id` option in the following order of priority:

1. The `--id` option passed on the command line.
1. The `id` field in the Markdown file's metadata.

After a file is successfully published as an issue, Kup writes the `id` back to the file’s metadata (with user confirmation before writing).

### How is the issue title determined?

Kup determines the issue title using the following hints, in descending priority:

1. The `title` field in the Markdown file's metadata.
1. If the first Markdown block is an H1 heading (in `# Title` form), Kup uses its text as the title. In this case, that H1 heading is excluded from the synced content.

What happens if Kup still cannot determine the issue title?

* When publishing a new issue, Kup generates a title automatically.
* When updating an existing issue, Kup ignores the title, which means the existing title will not be changed.

### How do I assign labels to an issue?

Whether you are blogging or publishing regular issues, labels are often useful, so Kup supports them as well.

Add a `tags` field to the Markdown file's metadata and specify one or more labels. These labels do not need to exist in the GitHub repository beforehand. If a label does not already exist, it will be created automatically when the issue is published.

What happens if there is no `tags` field in the metadata?

* When publishing a new issue, Kup will not assign any labels.
* When updating an existing issue, Kup ignores labels, which means the existing labels will not be changed.

When updating an existing issue, if the labels specified in the metadata differ from the issue's current labels, the new set completely replaces the old one.



## Documentation

* [Metadata examples for Markdown files](https://github.com/cssmagic/kup/issues/1)
* [How to generate an appropriate GitHub token for Kup](https://github.com/cssmagic/kup/issues/17)



## Other

### Roadmap

* See [the issue list for this project](https://github.com/cssmagic/kup/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc) for current plans.
* Feature requests and RFC discussions are welcome.

### About the Name

* Kup comes from the English word "pickup", suggesting lightweight transport.
* Kup is also a character in *Transformers*.

### About the Logo

* The logo was created by [Fasil](https://freeicons.io/profile/722) and provided for free via [freeicons.io](https://freeicons.io/icon/e-commerce-icons/pickup-truck-icon-26893).

***

## License

> Any code contributed to this project is considered authorized for commercial use by the project authors and their affiliated companies and distributed under this project's license.
>
> 任何贡献到本项目的代码，均视为授权本项目作者及其关联公司用于商业用途，并可按本项目协议进行分发。

MIT
