---
tags:
  - Computer-Science
  - TODO/need_to_upload
  - OS/Basic/BareMetal1
created: 2023-11-07
글확인: true
dg-publish: true
updated: 2023-11-18
번역확인: true
cover: "[[Pasted image 20231203165134.png]]"
---

# ベアメタル
ベアメタルとは以下のように定義される。

>[!quote]
>In computer science, bare machine (or bare metal) refers to a computer executing instructions directly on logic hardware without an intervening operating system.

先ほど、オペレーティングシステムはプログラムを管理するプログラムだと言いました。

つまり、本質はプログラムである。

C言語で書いた簡単なプログラムを実際のCPU上で動かしてみるのがこの章の目標です。

まだオペレーティングシステムと言うには憚られるが、[なんとリヌスのLinuxもターミナルプログラムから始まった！](https://joone.net/2018/10/22/27-%EB%A6%AC%EB%88%85%EC%8A%A4-%EC%9D%B4%EC%95%BC%EA%B8%B0-%EB%82%98%EB%A7%8C%EC%9D%98-%ED%84%B0%EB%AF%B8%EB%84%90-%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%A8/)

# 仮想環境の準備
我々がLinusになり、CPUで簡単なプログラムを動かしてみよう。

まず用意する環境は以下の通りです。

1. QEMU
2. プログラムエディタ(VScode, Vim, Emacsなど)

## QEMUをインストールする
QEMUは私たちが直接コンピュータを購入しなくても仮想のコンピュータを動かしてくれる仮想化ツールです。

基本的にオープンソースで、WindowsとLinuxで使用することができます。

Windowsの場合、別のWSL環境を構築してインストールすると、簡単にコマンドだけでインストールすることができます。

下記のリンクを使ってインストールしてみましょう。

<div class="transclusion internal-embed is-loaded"><div class="markdown-embed">



### WSL2
[WSL2 설치](https://www.google.com/search?q=wsl2+install&sca_esv=575552500&ei=AMc0ZdS2Ls-hhwP79qLABw&ved=0ahUKEwjUtq2MiYmCAxXP0GEKHXu7CHgQ4dUDCBA&uact=5&oq=wsl2+install&gs_lp=Egxnd3Mtd2l6LXNlcnAiDHdzbDIgaW5zdGFsbDIFEAAYgAQyBRAAGIAEMgUQABiABDIFEAAYgAQyBRAAGIAEMgUQABiABDIFEAAYgAQyBRAAGIAEMgUQABiABDIFEAAYgARI0xFQkgZY4xBwAngBkAEBmAHCAqABgQqqAQcwLjcuMC4xuAEDyAEA-AEBwgIKEAAYRxjWBBiwA8ICBxAAGA0YgATiAwQYACBBiAYBkAYK&sclient=gws-wiz-serp)

WSL2를 설치하고 설정이 끝나면 

[[kr/C 언어/C 언어와 친해지기 전의 준비#Linux\|C 언어와 친해지기 전의 준비#Linux]]로 넘어간다.

</div></div>


または、[QEMUサイトのダウンロードページ](https://www.qemu.org/download/)でもダウンロード可能です。

## プログラムエディタ
プログラムエディタの場合、ここでは説明しませんが、様々なエディタを調べて使いやすいものを選んで使ってみましょう。

とりあえず初めてプログラミングを始める人には次のようなオプションをおすすめします。
1. [Microsoft - VScode](https://code.visualstudio.com/)
2. [Jetbrain - CLion](https://www.jetbrains.com/ko-kr/clion/)

これらの編集ツールに慣れたら、以下のようにキーボードから手を離さずに使えるオプションを調べてみましょう。

1. [Neovim](https://neovim.io/) (現在使用しているツール)
	1. [[kr/지식나눔/LazyVim 설치 및 설정하기\|LazyVim]] (現在使っているツール)このプラグインをインストールして使用中
2. [Emacs](https://www.gnu.org/s/emacs/)

実はエディタは使いやすいように作ったツールに過ぎない、メモ帳や[Notepad++](https://notepad-plus-plus.org/)のような種類に関係なく何でも使ってもいい!!!

# Hello World?
では、簡単なプログラムを作って動かしてみましょう。

これはC言語を始めたときに書いたプログラムであるHello World！を出力するプログラムのコードです。

コードは下記のようになります。

```c
// hello.c
#include <stdio.h
int main()
{ printf("Hello World\n")
	printf("Hello World\n")；
	return 0；
}
```

果たして、このコードが動くかな？

もちろん ==*動作しない*==.

では、ここで”なぜ？” という質問に答えてみましょう。

今まで私たちはC言語とオペレーティングシステムの歴史について見てきました。

これまでの内容から私たちが知っておくべき内容は以下の通りです、

1.オペレーティングシステムは抽象化を提供する
2.Hello Worldのコードは `#include<stdio.h>` という標準ライブラリを使用している。
3.私たちが現在設定したQEMU環境は以下の写真のようになります。

![image-20231106142900672.png|center round|700](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EB%B2%A0%EC%96%B4%EB%A9%94%ED%83%88%20%EB%B6%80%ED%84%B0(1)%20-%20BIOS%20%EB%B6%80%ED%8A%B8%20Boot%20Loader%EA%B9%8C%EC%A7%80/image-20231106142900672.png)

そして、現在の全体的な構成は次のようになります。
![image-20231106143025350.png|center round|700](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EB%B2%A0%EC%96%B4%EB%A9%94%ED%83%88%20%EB%B6%80%ED%84%B0(1)%20-%20BIOS%20%EB%B6%80%ED%8A%B8%20Boot%20Loader%EA%B9%8C%EC%A7%80/image-20231106143025350.png)
左は私たちが現在使っている環境であり、右はQEMUで構成した環境です。

何がないのか？
1. *ディスプレイ*がない
2. キーボードがない
3. マウスがない
4. *ストレージ*がない!!!

なんてこった!!!

コンピュータの画面はどのように表示されるのか(`printf`関数を単純に使うだけでは全く考えなかった部分です!)

そして、私たちが書いたコードはCPUでどのような順番で処理されるのだろうか？

そもそも、私たちが書いたコードをどのようにQEMUに読めと**命令**するのだろうか？

# Toward printing "Hello World!"
コンピュータの*出発点*は何だろう？

それは==BIOS==です、BIOSとは何でしょうか？ウィキペディアによると、以下の通りです。
> [!quote] BIOS
> In computing, BIOS (/ˈbaɪɒs, -oʊs/, BY-oss, -⁠ohss; Basic Input/Output System, also known as the System BIOS, ROM BIOS, BIOS ROM or PC BIOS) is firmware used to provide runtime services for operating systems and programs and to perform hardware initialization during the booting process (power-on startup)
[BIOS](https://en.wikipedia.org/wiki/BIOS) - https://en.wikipedia.org/wiki/BIOS

つまり、簡単な入出力機能を実行し、OSを実行させ、ハードウェアを初期化する==ファームウェア==です。

突然ファームウェアという新しい単語が出てきましたが、結局ファームウェアもプログラムです。

ここで重要なキーワードは*入出力機能*、*OSの実行*と*ハードウェアの初期化*である。

この3つのキーワードに上記の質問のほとんどに対する答えが存在する、一つずつ見てみよう。

## ハードウェアの初期化 (コードの移動)
まず、皆さんが書いたコードをどのように動かすことができるでしょうか？

有線通信? 無線通信?, いいえ、あなたのコンピュータはまだそれほどスマートではありません。

私たちは *主記憶装置*(USB、Floppy Disk、HDD、SSDなど)を通して移動します。

図に置き換えると次のようになります。
![image-20231106160103504.png|center round|700](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EB%B2%A0%EC%96%B4%EB%A9%94%ED%83%88%20%EB%B6%80%ED%84%B0(1)%20-%20BIOS%20%EB%B6%80%ED%8A%B8%20Boot%20Loader%EA%B9%8C%EC%A7%80/image-20231106160103504.png)
流れを説明すると下記のようになります。
1.まず、皆さんが作ったコードをコンパイルします。
2.コンパイルしたバイナリを記憶装置(ここではFloppy disk)に保存します。
3.そしてコンピュータに認識させる(まるでUSBを挿すように)

そして、次はBIOSが登場します。

## BIOS
BIOSはまずハードウェアを認識し、どのような場所にどのようなデバイスが接続されているか、もしRAMメモリがあれば容量はどれくらいか、モニター、キーボード、マウスは接続されているかなどを確認します。

下の図で流れを理解してみましょう。
![image-20231106161337381.png|center round|600](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EB%B2%A0%EC%96%B4%EB%A9%94%ED%83%88%20%EB%B6%80%ED%84%B0(1)%20-%20BIOS%20%EB%B6%80%ED%8A%B8%20Boot%20Loader%EA%B9%8C%EC%A7%80/image-20231106161337381.png)
RAMだけでは物足りないので、他のハードウェアを追加してみましょう。
まずは画面表示のためのモニター。
![image-20231106161758316.png|center round|600](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EB%B2%A0%EC%96%B4%EB%A9%94%ED%83%88%20%EB%B6%80%ED%84%B0(1)%20-%20BIOS%20%EB%B6%80%ED%8A%B8%20Boot%20Loader%EA%B9%8C%EC%A7%80/image-20231106161758316.png)
そして、私たちが書いたコードが存在するストレージを追加したら？
![image-20231106161942699.png|center round|600](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EB%B2%A0%EC%96%B4%EB%A9%94%ED%83%88%20%EB%B6%80%ED%84%B0(1)%20-%20BIOS%20%EB%B6%80%ED%8A%B8%20Boot%20Loader%EA%B9%8C%EC%A7%80/image-20231106161942699.png)

やっと最新のコンピュータで使われるハードウェアを追加した,コンピュータらしい(?)コンピュータが完成しました。そして、接続したハードウェアをBIOSが認識することも分かりました。

しかし、まだ解決しない問題がある。

ストレージに私たちが保存したコードが保存されていて、ストレージをBIOSが認識することもわかった。

しかし、少し考えれば、BIOSの立場ではどんなデータが入ってるかもわからないストレージが認識されたのに、どうやってこのデータをCPUに読ませることができるのだろうか？

*どこに*、*どんな*データが存在するのかBIOSの立場では全く分からないのに？

## ブートローダ(コードの出発点)
実は答えは簡単で、約束をしておくことです。

エンジニアたちは、前章で提示した問題を解決するために、BIOSというプログラムが最後に行うべき行動を *約束*しました。

まず、BIOSは[[jp/OS/ベアメタル(Bare-metal)から(1) - BIOS、ブート過程とブートローダー作成#保存装置が複数ある場合?\|指定された記憶装置]]に存在する最初のセクタ(0x200, 512 bytesの大きさ) [[jp/OS/ベアメタル(Bare-metal)から(1) - BIOS、ブート過程とブートローダー作成#なぜ0x7c00なのか？\|決まったアドレス(0x7c00)]]にコピー/貼り付けます。

第二に、BIOSは指定されたアドレスにジャンプし、私たち(または、あなたが作ったコードを動作させます!!)！

図で表すと次のようになります。
![image-20231107143135220.png|center round|700](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EB%B2%A0%EC%96%B4%EB%A9%94%ED%83%88%20%EB%B6%80%ED%84%B0(1)%20-%20BIOS%20%EB%B6%80%ED%8A%B8%20Boot%20Loader%EA%B9%8C%EC%A7%80/image-20231107143135220.png)!
![image-20231107143202779.png|center round|700](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EB%B2%A0%EC%96%B4%EB%A9%94%ED%83%88%20%EB%B6%80%ED%84%B0(1)%20-%20BIOS%20%EB%B6%80%ED%8A%B8%20Boot%20Loader%EA%B9%8C%EC%A7%80/image-20231107143202779.png)![image-20231107143202779.png|center round|700](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EB%B2%A0%EC%96%B4%EB%A9%94%ED%83%88%20%EB%B6%80%ED%84%B0(1)%20-%20BIOS%20%EB%B6%80%ED%8A%B8%20Boot%20Loader%EA%B9%8C%EC%A7%80/image-20231107143202779.png)![image-20231107143801801.png|center round|700](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EB%B2%A0%EC%96%B4%EB%A9%94%ED%83%88%20%EB%B6%80%ED%84%B0(1)%20-%20BIOS%20%EB%B6%80%ED%8A%B8%20Boot%20Loader%EA%B9%8C%EC%A7%80/image-20231107143801801.png) 

このような過程を経て、Floppy disk、USB、HDDなどの記録装置に保存されたコードが初めてコンピュータで実行されます。

# 付録
## 保存装置が複数ある場合?
私たちが接続したデバイスがFloppy diskだけでなく、様々なデバイスを接続するとどうなるでしょうか？

または、Floppy diskを接続する前にコンピュータにHDDが接続されていたら？

もし皆さんが様々なOSをインストールして実行したいとしたら？

この問題に対する答えは、BIOSがハードウェアを初期化することにあります。

BIOSはデバイスを初期化する過程で、すでにどのようなデバイスが接続されているかを認識しているので、BIOSを通してどのストレージを使用するかを指定することができます。
![image-20231114222459509.png|center round|400](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EB%B2%A0%EC%96%B4%EB%A9%94%ED%83%88%20%EB%B6%80%ED%84%B0(1)%20-%20BIOS%20%EB%B6%80%ED%8A%B8%20Boot%20Loader%EA%B9%8C%EC%A7%80/image-20231114222459509.png)
\[最新のBIOSで起動順序を設定する\].


## なぜ0x7c00なのか？
なぜ私たちが作成したコードが最初に記録される場所が0x0777でもなく0x07c0なのか？

実はこのような値を持つ理由は一つもない!!!

ほとんどのコンピュータ工学におけるこのような疑問のある値は歴史と関係が深い場合が多く、今回も同じケースである。

結論から言えば、初期の商用コンピュータ（16KiBまたは32KiBサイズのメモリが使われていた頃）が登場したときのIBMやMS-DOSなどの歴史を経て、事実上の標準として0x07c0に決まった。

詳細は以下を参照しよう(0x07c0と0x7c00が2つ登場する理由は次の章で)。
- Booting-Wikipedia](http://cis2.oc.ctc.edu/oc_apps/Westlund/xbook/xbook.php?unit=04&proc=page&numb=8)
- [How is the BIOS ROM mapped into address space on PC?](https://stackoverflow.com/questions/7804724/how-is-the-bios-rom-mapped-into-address-space-on-pc)
- なぜBIOSはx86でMBRを0x7C00にロードするのか](https://www.glamenv-septzen.net/en/view/6)
- 上部メモリ領域](https://en.wikipedia.org/wiki/Upper_memory_area)

上の資料を参考すれば、もう少し詳しい流れを理解することができます。

整理された流れは次のようになります。

1.CPUにreset信号を渡すと、最初の実行フロー(reset vector)が存在するアドレスをレジスタに保存します。
2.実行されたコードはBIOSが入ってるROMアドレスです。
	1. 特定のアドレスはROM、グラフィックカード、モニタ(次の章でコードで説明します)などにマッピングされています。
	2.これらのマッピングはCPUの設計によるものです。
3.BIOSは最後にコードを特定の領域(IBM compatible PCの場合は0x7c00)にコピーします。

>[!info]- Intel Pentiumの起動コードは？
>### 6.1.2. First Instruction Executed 
>To generate an address, the base part of a segment register is added to the effective address to form the linear address. This is true for all modes of operation, although the base address is calculated differently in protected and real-address modes. To fetch an instruction, the base portion of the CS register is added to EIP to form a linear address (see Chapter 9 and Chapter 11 for details on calculating addresses).
> In real-address mode, when the value of the segment register selector is changed, the base portion will automatically be changed to this value multiplied by 16. However, immediately after reset, the base portion of the CS register behaves differently: It is not 16 times the selector value. Instead, the CS selector is 0F000H and the CS base is 0FFFF0000H. The first time the CS selector value is changed after reset, it will follow the above rule (base = selector ∗ 16). As a result, after reset, the first instruction that is being fetched and executed is at physical address: CS.base + EIP = 0FFFFFFF0H. ==This is the address to locate the EPROM with the initialization code.== This address is located 16 bytes below the uppermost address of the physical memory of the Pentium processor.
> [Pentium® Processor Family Developer's Manual](http://datasheets.chipdb.org/Intel/x86/Pentium/24143004.PDF)


## それでOSはどうやって？
では、OSはどのような過程を経て実行されるのでしょうか？

全体的な流れは下の図のようになります。
![image-20231107153309542.png](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EB%B2%A0%EC%96%B4%EB%A9%94%ED%83%88%20%EB%B6%80%ED%84%B0(1)%20-%20BIOS%20%EB%B6%80%ED%8A%B8%20Boot%20Loader%EA%B9%8C%EC%A7%80/image-20231107153309542.png)
\[出典 - https://en.wikipedia.org/wiki/BIOS\]

今まで私たちが作ってメモリにロードされるコードをBoot Loaderと呼んでこのBoot LoaderにOSの中心であるKernelをメモリにロードして実行する流れで進みます!!!

このような流れはOSをUSBなどに入れてインストールする過程と同じであり、USBにロードされたKernelを通してOSを実行させ、USBにあるOSコードをUSBに保存することです。

私たちがパソコンを買うたびに行ってきたOSのインストールがこのような過程で行われていたのです。
## 図
全体の変化を示した図です。
![image-20231107143827633.png|center round|700](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EB%B2%A0%EC%96%B4%EB%A9%94%ED%83%88%20%EB%B6%80%ED%84%B0(1)%20-%20BIOS%20%EB%B6%80%ED%8A%B8%20Boot%20Loader%EA%B9%8C%EC%A7%80/image-20231107143827633.png)


# 宿題
1.[Floppy diskが何であるかを知る](https://en.wikipedia.org/wiki/Floppy_disk)
2.では、BIOSの出発点は？
	1. [ファームウェアを調べる](https://en.wikipedia.org/wiki/Firmware)
	2. [ROMを調べる](https://en.wikipedia.org/wiki/Read-only_memory)
	3.上記のリンクを調査してもう一度記事を読む