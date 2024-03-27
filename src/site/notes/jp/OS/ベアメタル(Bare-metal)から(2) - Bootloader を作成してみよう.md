---
{"dg-publish":true,"permalink":"/jp/OS/ベアメタル(Bare-metal)から(2) - Bootloader を作成してみよう/","tags":["OS/Basic/Baremetal2"],"created":"2023-11-23","updated":"2024-03-26"}
---

# Boot Loaderの作成
次はBoot Loaderを直接作ってみましょう。

私たちはIntelのx86をベースにコードを書かなければならないので、x86の16bitモード(Real mode)を基準にアセンブリを作成しなければなりません。

また、今回使うnasmのアセンブラでサポートする機能(マクロなど)を使ってコードを作成します。

まず、コードを作成するため、知っておくべきコードを以下に整理します。

## Segmentレジスタ

### アドレス指定
Real modeは16bitモードであり、レジスタが持つことができる最大値は0xFFFFであることが分かる。

つまり、16bitコンピュータで使用できるメモリの最大サイズが64KB(65,636 bytes)であることを意味する。

前回見たビデオメモリアドレスである0xB8000よりはるかに小さいことが分かる。

x86のReal Modeの場合、セグメントレジスタを利用して最大20bitまでアドレスを指定できるように設計されている。

つまり、最大1MBのメモリを使用できるようになっている。

そして、このようなアドレス指定方式は次のように記述される。

```c
mov byte [ es: si ], 1
```

ここで `es` は Extra Segment を意味し、 `si` は Index Register である。

これらのセグメントレジスタと他のレジスタを利用してアドレスを指定することができる。

実際の計算方法は以下の通りである。
![Pasted image 20231129213052.png|center round|600](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EB%B2%A0%EC%96%B4%EB%A9%94%ED%83%88%20%EB%B6%80%ED%84%B0(2)%20-%20%EB%82%98%EB%A7%8C%EC%9D%98%20%EC%9E%91%EC%9D%80%20Boot%20Loader/Pasted%20image%2020231129213052.png)
\[出典 - https://en.wikipedia.org/wiki/X86_memory_segmentation \]

という式で考えると下記のように考えると簡単です。
$$
Address = Segment\ \text{* 0x10} + \text{Offset}
$$ 


### Far jump - x86 JMP Instruction
上で見たセグメントレジスタを利用してアドレスを拡張して使用するのがx86の特徴の一つであり、この特徴と深く関係している命令が `jmp` である。

したがって、 `jmp` 命令も条件によるジャンプ(conditional)、レジスタを利用したジャンプ(register-indirect)が存在する。


ここで説明するアドレス指定方式は、絶対アドレス方式の中でも次のような文法である。

```c
jmp 0x07C0:START
```

このような文法はx86の16bit(real mode)モードでFar jumpと呼ばれるアドレス指定方式であり、コード実行時に
Instruction Pointer レジスタが右側の値(`START`)で指定され、コードセグメントレジスタの値が左側の値(0x07c0)で指定されます。
## NASM文法
次に、アセンブラ専用文法をいくつか見てコード作成を始めましょう。
### 構文
1. \[ORG 0x0\]：コードの開始点を0x0に設定
2. \[BITS 16\]：16bitコード(Real Modeコード)であることを指定します。

### トークン
`$` と `$$` は、NASMで特殊な意味を持つトークンです。

>[!quota]
>`$` evaluates to the assembly position at the beginning of the line containing the expression; so you can code an infinite loop using `JMP $`.
>
>`$$` evaluates to the beginning of the current section; so you can tell how far into the section you are by using `($-$$)`
>Reference - https://nasm.us/doc/nasmdoc3.html

つまり、現在の自分のアドレスと現在の自分のセクションの位置を意味します。

上記、ソースでも説明しているように `jmp $`の場合、無限ループの意味を持っています。

`$ - $$` は自分が使っているセクションからどれだけ離れているかを示す。

つまり、`times 510 - ($ - $$) db 0x00` というコードは、あるセクタで自分が書いたコードの残りの部分を0x00で埋めるという意味になります。
(timesは繰り返しを表し、もし0x00というデータを64個埋めたい場合は `times 64 db 0x00` と表します)

# コード
Boot loaderのコードは次のようになります。

```c
;bootloader.asm
[ORG 0x0]
[BITS 16]

SECTION .text

jmp 0x07C0:START

START:
  mov ax, 0x07C0
  mov ds, ax
  mov ax, 0xB800
  mov es, ax

  mov si, 0

.SCREENCLEARLOOP:
  mov byte [ es: si ], 0

  mov byte [ es: si + 1 ], 0x0A

  add si, 2

  cmp si, 80 * 25 * 2

  jl .SCREENCLEARLOOP

  mov si, 0
  mov di, 0

.MESSAGELOOP:
  mov cl, byte [ si + MESSAGE1 ]

  cmp cl, 0
  je .MESSAGEEND

  mov byte [ es: di ], cl

  add si, 1
  add di, 2

  jmp .MESSAGELOOP
.MESSAGEEND:

  jmp $

MESSAGE1: db "\
_   _      _ _        __        __         _     _ _                            \
| | | | ___| | | ___   \ \      / /__  _ __| | __| | |                          \
| |_| |/ _ \ | |/ _ \   \ \ /\ / / _ \| '__| |/ _` | |                          \
|  _  |  __/ | | (_) |   \ V  V / (_) | |  | | (_| |_|                          \
|_| |_|\___|_|_|\___/     \_/\_/ \___/|_|  |_|\__,_(_)                          \
", 00

times 510 - ($ - $$) db 0x00

db 0x55
db 0xAA
```
# 実行

次に、アセンブラを使ってアセンブリ言語をバイナリに変えてみましょう。

``` bash
nasm -o bootloader.bin bootloader.asm
```

## QEMUでコンピュータ自作
そしてQEMUで実行してみましょう。

``` bash
qemu-system-x86_64 -m 10 -fda bootloader.bin
``` 
と実行します。
QEMUは先ほど言ったように仮想マシンを作ってくれるプログラムで、上の命令は

-m 10: 10MBメモリを使用
-fda: フロッピーディスクファイルを指定

つまり、私たちが書いたコード(`bootloader.bin`)をフロッピーディスクに書き込んで、それをコンピュータに入れることを意味します!!!


![Pasted image 20231201104620.png|center round|700](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EB%B2%A0%EC%96%B4%EB%A9%94%ED%83%88%20%EB%B6%80%ED%84%B0(2)%20-%20%EB%82%98%EB%A7%8C%EC%9D%98%20%EC%9E%91%EC%9D%80%20Boot%20Loader/Pasted%20image%2020231201104620.png)
\[QEMUを利用することは上の図でパソコンを自作することと同じである.\].

実行した結果、下記のように表示されることが確認できます。
![image-20231128184134639.png|center round|500](/img/user/kr/%EC%9A%B4%EC%98%81%EC%B2%B4%EC%A0%9C/assets/%EA%B0%80%EC%83%81%ED%99%94,%20QEMU%EC%99%80%20KVM%EC%BD%94%EB%93%9C%EB%A5%BC%20%EC%A4%91%EC%8B%AC%EC%9C%BC%EB%A1%9C%20%EB%B3%B4%EA%B8%B0(QEMU%20%EB%A7%8C%EB%93%A4%EC%96%B4%20%EB%B3%B4%EA%B8%B0)/image-20231128184134639.png) 



# 同じ結果別のコード
次は同じ結果を他のコードを使って作ってみましょう。

下記のようなコードを実行すると同じ結果が得ルことができます。

新しく追加されたコードで `int` と `call` などがありますね。

一体どうやって同じ文字が画面に表示されるのでしょうか？


```c
[ORG 0x7C00]
[BITS 16]

%define light_grey 0x07

START:
  call .SCREENCLEARLOOP
  call .RESETCURSOR
  mov si, MESSAGE1
  call .PRINTMESSAGE
  jmp $

;Set Cursor position
;AH=02h	BH = Page Number, DH = Row, DL = Column
.RESETCURSOR:
  mov ah, 0x02
  mov bh, 0x00
  mov dh, 0x00
  mov dl, 0x00

  int 0x10
  ret

.SCREENCLEARLOOP:
  mov si, 0
  mov al, 0

.clear:
  call .PRINTCHAR
  add si, 1
  cmp si, 80 * 25
  jl .clear

  mov si, 0
  ret
;Teletype output
;AH=0Eh	AL = Character, BH = Page Number, BL = Color (only in graphic mode)
.PRINTCHAR:
  mov ah, 0x0E
  mov bh, 0x00
  mov bl, light_grey

  int 0x10
  ret

.PRINTMESSAGE:
.nextchar:
  mov al, [si]
  inc si
  or al, al
  jz .exit_function
  call .PRINTCHAR
  jmp .nextchar

.exit_function:
  ret

MESSAGE1: db "\
_   _      _ _        __        __         _     _ _                            \
| | | | ___| | | ___   \ \      / /__  _ __| | __| | |                          \
| |_| |/ _ \ | |/ _ \   \ \ /\ / / _ \| '__| |/ _` | |                          \
|  _  |  __/ | | (_) |   \ V  V / (_) | |  | | (_| |_|                          \
|_| |_|\___|_|_|\___/     \_/\_/ \___/|_|  |_|\__,_(_)                          \
", 00

times 510 - ($ - $$) db 0

db 0x55
db 0xAA
```
# Homework
1. x86 memory mapping を調べてみる
	1. https://wiki.osdev.org/Memory_Map_(x86)
	2. https://stackoverflow.com/questions/3215878/what-are-in-out-instructions-in-x86-used-for
2. コードの最後にある0xAA, 0x55 の意味を調べてみる
	1. https://en.wikipedia.org/wiki/Master_boot_record
3. 次回のために、割り込み、イベントなどについて調べる。
