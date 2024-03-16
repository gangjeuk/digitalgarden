---
created: 2023-11-11
tags:
  - Tips/LazyVim
dg-publish: true
cover: "[[image-20231111185327420.png]]"
---



VimをIDEみたいに設定してくれるLazyVimを使ってVimを飾ってみましょう。

# LazyVim
LazyVimは基本的にNeoVimのsetupの一つで、NeoVimの設定コレクションのようなものです。

LazyVimの他にもLunarVim, AstroNvim, SpaceVimなどがあるそうですが、今回このようなsetupの存在を初めて知ったので、一番最初に見たLazyVimを中心にどのようにインストールして設定をするか見てみましょう。

# インストール
LazyVimのようなsetupは簡単に使うことが目的なので、簡単にインストールできます。
## Backup
まず、現在使ってるNeoVim関連の設定のバックアップします。 (特に設定がなければ、削除してもいいです)

NeoVimに関する設定ファイルはnvimディレクトリにあります。
```bash
# required
mv ~/.config/nvim{,.bak}

# optional but recommended
mv ~/.local/share/nvim{,.bak} 
mv ~/.local/state/nvim{,.bak} 
mv ～/.cache/nvim{,.bak}
```

## Install LazyVim

次はGItでLazyVimを自動でインストールしてくれるファイルをダウンロードしましょう。

``` bash
git clone https://github.com/LazyVim/starter ~/.config/nvim
```
そして `.git` ディレクトリを削除しましょう。

```bash
rm -rf ~/.config/nvim/.git
```
最後にNeoVimを実行すればいいです!

```bash
nvim
```

## Pluginのインストール
インストールが終わったら次の画面が出たら、次は `l` を押してlazyに入りましょう。

![image-20231111185327420.png](/img/user/kr/%EC%A7%80%EC%8B%9D%EB%82%98%EB%88%94/assets/LazyVim%20%EC%84%A4%EC%B9%98%20%EB%B0%8F%20%EC%84%A4%EC%A0%95%ED%95%98%EA%B8%B0/image-20231111185327420.png)

下記のリストはLazyVimで基本的に設定されたプラグインで、その他に必要なプラグインを追加でインストールすることも可能です。

![image-20231111192139348.png](/img/user/kr/%EC%A7%80%EC%8B%9D%EB%82%98%EB%88%94/assets/LazyVim%20%EC%84%A4%EC%B9%98%20%EB%B0%8F%20%EC%84%A4%EC%A0%95%ED%95%98%EA%B8%B0/image-20231111192139348.png)

何がどんな役割をするプラグインか知りたい人は下記のリンクを参考してください。

- https://www.lazyvim.org/plugins

または `e` (Lazy Extras)キーを押して追加でインストールできるプラグインのリスト(最近出ている人工知能を利用したコードサポータ機能、プログラミング言語の支援拡張などを追加可能)を確認することも可能です。

インストール可能なプラグインの中で下記のリストを選択してインストールしてみよう(または自分に合うものを選んで)

- `formatting.prettier`
- `lang.clangd`s
- `lang.cmake`
- `lang.markdown`
- `lang.python`
# リファレンス
https://www.lazyvim.org/
