---
tags:
  - CTF/basic/ELF
created: 2023-10-10
글확인: true
dg-publish: true
번역확인: true
updated: 2023-11-14
cover: "[[image-20231010161636907.png]]"
---
# リファレンス
[[ELF-64 Object File Format.pdf]]
[[ELF-64 Object File Format, Version 1.4 1 ELF-64 Object File Format Including HP and HP-UX Extensions.pdf]]
https://www.sco.com/developers/gabi/2012-12-31/contents.html
https://intezer.com/blog/malware-analysis/executable-and-linkable-format-101-part-3-relocations/
https://docs.oracle.com/cd/E19683-01/817-3677/chapter6-42444/index.html
 
# ELF Format
ELF(Executable and Linking Format)は代表的に3つのタイプのタイプがあります。

1. *relocatable file* → executableまたは shared object fileを生成するためのコードとデータを持つファイル。
2. *executable file* → プロセスを生成(実行)するのに適したファイル。
3. *shared object file* → Linkingのためのデータとコードを持つファイル。


> [!info]
> ここでLinkingとは。文字通り'繋ぐ'ことを意味する。
> 私たちがよく使う言葉のうち、「ライブラリとのリンク」、「ダイナミックリンク」などで使われる単語ど同じ意味です。
> もう少し詳しく説明すると下記のようになります。
> 1. Link editorがshared object fileをrelocatable fileまたはshared object fileを利用して他のobject fileを生成すること
> 2. dynamic linker がプロセスを生成するために shared object fileとexecutable fileを結合すること


しかし、結局、3つのタイプは*Linking*と*Execution*という大きな役割で区別することができます。

役割を基準で表すと下記のようになります。

![image-20231005122731689.png|center](/img/user/kr/CTF/Basic/assets/ELF%20%ED%8C%8C%EC%9D%BC%20%ED%98%95%EC%8B%9D%EC%97%90%EC%84%9C%20%EC%9E%AC%EB%B0%B0%EC%B9%98(Relocation),%20%EB%A7%81%ED%82%B9(Linking)%20%EA%B9%8C%EC%A7%80/image-20231005122731689.png)

- ELF Header: ファイルの構成に対する''road map''を持っています
	- ELFファイル形式、実行マシンのアーキテクチャなど
- Section header table: ファイルのセクションに関する情報を持つ
	- 各Sectionのentryアドレス、entry名、Sectionサイズなど
	- reloaction fileのようにリンクのために使われるファイルは必須である
	- executable fileのように実行するためのファイルには必要ありません
- Section: オブジェクトファイルのリンクのための情報を持つ
	- Instruction, data, symbol table, relocation informationなど
- Program header table: システムにプロセスをどのように実行させるかについての情報を持っています
	- executable fileのような実行のためのファイルには必要である
	- 当然、relocation fileのような実行に関係がないファイルには必要ない。
- Segment: 複数の section で構成された構造体

Segmentは上で説明したように複数のSectionで構成された構造体です

例えば、一般的に Data Segmentと呼ばれるデータが含まれているSegmentの場合、次のようなSectionで構成されている。

| Data Segment | Description                  |
| ------------ | ---------------------------- |
| .data        | Initialized data             |
| .dynamic     | Dynamic linking information  |
| .got         | グローバルオフセットテーブル |
| .bss         | 初期化されていないデータ     |



# 実習準備
## Hello World!!!(Executable file)
下記の実習をするため簡単なバイナリを生成して進めます。

進行するためHello, World!!!を出力するプログラムを作成してコンパイルをしました。

```c
// title: hello.c
#include <stdio.h

int main(){
        char* hello = "Hello, World!!!"；
        printf("%s\n", hello)；
        return 0；
}
```


コンパイルは次のようにします。

```bash
gcc hello.c -o hello
``` 
## Global(Linking)
同じく、Linkingの確認のために簡単なバイナリを生成します。

プログラムは下記のようです。
```c
// title: global.c

int global_var = 1；

void func_A(void){
        global_var = 123；
}

int start(void)
{ global_var = 123; } int start(void)
        func_A()；
        return 0；
}

```

```bash
gcc -c -ffreestanding global.c

#-c: オブジェクトファイルを作成
#-ffreestanding: ライブラリなしでコンパイルする
```




# Data Structure
上で紹介したそれぞれのヘッダと構造について実際どんな構造体で構成されてるか見てみましょう。

まず、Data Type は次のようになります。

![image-20231006122304854.png|center](/img/user/kr/CTF/Basic/assets/ELF%20%ED%8C%8C%EC%9D%BC%20%ED%98%95%EC%8B%9D%EC%97%90%EC%84%9C%20%EC%9E%AC%EB%B0%B0%EC%B9%98(Relocation),%20%EB%A7%81%ED%82%B9(Linking)%20%EA%B9%8C%EC%A7%80/image-20231006122304854.png)

## File header
```c
typedef struct {
unsigned char e_ident[16]; /* ELF の識別子 */ 
Elf64_Half e_type; /* オブジェクトファイルの種類 */ 
Elf64_Half e_machine; /* マシンの種類 */ 
Elf64_Word e_version; /* オブジェクトファイルのバージョン */
Elf64_Addr e_entry; /* エントリーポイントのアドレス */
Elf64_Off e_phoff; /* プログラムヘッダオフセット */ Program header offset 
Elf64_Off e_shoff; /* セクションヘッダオフセット */ セクションヘッダオフセット 
Elf64_Word e_flags; /* プロセッサ固有フラグ */ 
Elf64_Half e_ehsize; /* ELF ヘッダサイズ */  
Elf64_Half e_phentsize; /* プログラムヘッダエントリーサイズ */  
Elf64_Half e_phnum; /* プログラムヘッダエントリの数 */  
Elf64_Half e_shentsize; /* セクションヘッダエントリーサイズ */  
Elf64_Half e_shnum; /* セクションヘッダエントリの数 */  
Elf64_Half e_shstrndx; /* セクション名文字列テーブルのインデックス */  
}Elf64_Ehdr；

```

ファイルヘッダの場合
- マジックナンバー: ELF...
- マシン: x86, ARM, MIPS, ...
- オペレーティングシステム: Linux, Unix, System V
などの情報を持っています。

詳細なフィールドの情報と `e_flags` などのフラグリストは [[ELF_Format.pdf]] の 5 ページにある。

ここで注意すべき値は、これから説明する [[jp/CTF/Basic/ELF ファイル形式からRelocation Linkingまで#Section header entry\|Section]]と [[jp/CTF/Basic/ELF ファイル形式からRelocation Linkingまで#Program\|Program]]で扱う Section header, Program headerの位置を示す *e_phoff*, *e_shoff* である。

各ヘッダはエントリで構成され、次のような構造になっています。

![entries.png|center](/img/user/kr/CTF/Basic/assets/ELF%20%ED%8C%8C%EC%9D%BC%20%ED%98%95%EC%8B%9D%EC%97%90%EC%84%9C%20%EC%9E%AC%EB%B0%B0%EC%B9%98(Relocation),%20%EB%A7%81%ED%82%B9(Linking)%20%EA%B9%8C%EC%A7%80/entries.png)
### Section header entry
まず、Section entryの構造体の場合、次のような構造になっています。

```c
typedef struct{ 
Elf64_Word sh_name; /* Section name */ 
Elf64_Word sh_type; /* セクションタイプ */
Elf64_Xword sh_flags; /* セクション属性 */
Elf64_Addr sh_addr; /* メモリ中の仮想アドレス */
Elf64_Off sh_offset; /* ファイル内のオフセット */
Elf64_Xword sh_size; /* セクションのサイズ */ 
Elf64_Word sh_link; /* 他のセクションへのリンク */
Elf64_Word sh_info; /* 雑多な情報 */ 
Elf64_Xword sh_addralign; /* アドレス整列の境界 */
Elf64_Xword sh_entsize; /* セクションにテーブルがある場合、エントリのサイズ */ 
}Elf64_Shdr；
```

Section で最初に見るべきフィールドは *sh_type*, *sh_flags* です。

sh_type の場合、文字通り Section のタイプを決定します。
Sectionのタイプには、何も入っていないNULL Section、リンカのシンボル情報を含むSection、ダイナミックリンク情報を持つSectionなどがあります。

上記のsh_typeによってSectionが持つ性質が変わるのですが、それを表現したのがsh_flagsです。

sh_flagsの場合、Sectionのメモリ搭載の有無、書き込み可能かどうかなどを決めるフラグが存在します。

例を簡単に見てみましょう。

#### Example
任意のバイナリを持って次のようなコマンドで簡単にSectionの情報を得ることができます。

```bash
readelf -a hello
``` 

一番代表的な領域である.text, .rodata, .data 領域を見てみましょう。

```bash
Section Headers：
  [Nr] Name Type Address Offset
       Size EntSize Flags Link Info Align
---------------------------------------------------------------------
  [16] .text PROGBITS 0000000000001060 00001060 00001060
       0000000000000113 0000000000000000 AX 0 0 0 16
  .
  .
  [18] .rodata PROGBITS 0000000000002000 0000000000002000 00002000
       000000000000000013 0000000000000000 A 0 0 0 4 .
  A 0 0 4 .
  00000000000000000000 A 0 0 0 4 .
  [25] .data PROGBITS 0000000000004000 0000000000004000 00003000
       00000000000000000010 0000000000000000 WA 0 0 0 8
```

次のようにまとめることができます。

| Field name | Flags |
| ---------- | ----- |
| .text | AX |
| .rodata | A |
| .data | WA |

各フラグの意味は以下の通りです。

```bash
Key to Flags：
  W (write), A (alloc), X (execute), M (merge), S (strings)...
``` 

簡単に解釈すると、Read only dataであるrodataはメモリにロードされるが、書き込みはできないことが分かる。

また、一般データであるdataの場合は当然ロードされ、書き込みも可能です。

最後にtextの場合、メモリにロードされますが、書き込みではなく読み取りのみ可能です。
### Program header entry
Program header tableのEntryは次のような構造になっています。

```c 
typedef struct
{
Elf64_Word p_type; /* Type of segment */ 
Elf64_Word p_flags; /* Segment attributes */ 
Elf64_Off p_offset; /* ファイル内のオフセット */ 
Elf64_Addr p_vaddr; /* メモリ内の仮想アドレス */ Elf64_Addr p_vaddr; /* メモリ内の仮想アドレス */
Elf64_Addr p_paddr; /* 予約 */ 
Elf64_Xword p_filesz; /* ファイル内のセグメントのサイズ */ 
Elf64_Xword p_memsz; /* メモリ内のセグメントサイズ */ 
Elf64_Xword p_align; /* セグメントのアライメント 
}Elf64_Phdr；
```

Program header tableで初めて==Segment==という単語を見ることができますが、上述したようにSegmentは複数のSectionの集まりです。

Program header tableでSegmentという単語が登場する理由は、Program header tableは文字通り==プログラム==が実行する時、メモリ領域に対する権限をどのように設定すべきかを設定するために存在するからです。

その目的を達成するためにメモリのアドレス(*p_vaddr*, *p_paddr*), メモリのサイズ(*p_memsz*), メモリフラグ(*p_flags* - 読み書きなどを調節する)のフィールドが存在することが分かります。

#### Example
例としてもう一度同じコマンドを使って見てみましょう。
(見やすくするため、少し操作をしました)

```bash
Program Headers:
  Type           Offset             VirtAddr           PhysAddr
                 FileSiz            MemSiz              Flags  Align
---------------------------------------------------------------------
  .
  .
  LOAD[2]           0x0000000000000000 0x0000000000000000 0x0000000000000000
                 0x0000000000000628 0x0000000000000628  R      0x1000
  LOAD[3]           0x0000000000001000 0x0000000000001000 0x0000000000001000
                 0x0000000000000181 0x0000000000000181  R E    0x1000
  LOAD[4]           0x0000000000002000 0x0000000000002000 0x0000000000002000
                 0x00000000000000f4 0x00000000000000f4  R      0x1000
  LOAD[5]           0x0000000000002db8 0x0000000000003db8 0x0000000000003db8
                 0x0000000000000258 0x0000000000000260  RW     0x1000
  .
  .
 Section to Segment mapping:
  Segment Sections...
   00
   01     .interp
   02     .interp .note.gnu.property .note.gnu.build-id .note.ABI-tag .gnu.hash .dynsym .dynstr .gnu.version .gnu.version_r .rela.dyn .rela.plt
   03     .init .plt .plt.got .plt.sec .text .fini
   04     .rodata .eh_frame_hdr .eh_frame
   05     .init_array .fini_array .dynamic .got .data .bss
   .
   .
```



まず、Segmentの構成について見てみましょう。

05 Segmentに私たちに馴染みのある.data,.bss,.gotなどが見えます、つまり、ここはおそらくメモリにロードされて書き込みが可能なゾーンの集まりだと予想できます。

また、LOAD\[5\]領域を見ると、フラグがRWであることが分かり、予想と一致することが分かります。

# Linking
次はELFファイルやOSのプログラム実行の花と言えるLinking過程について説明します。

先に説明した[[jp/CTF/Basic/ELF ファイル形式からRelocation Linkingまで#Section header entry\|Section header entry]]をもう一度思い出してみましょう。

使用される構造体は次の通りです。

```c
typedef struct
構造体 { ```c
Elf64_Word sh_name; /* Section name */ 
Elf64_Word sh_type; /* セクションタイプ */
Elf64_Xword sh_flags; /* セクション属性 */
Elf64_Addr sh_addr; /* メモリ内の仮想アドレス */
Elf64_Offset sh_offset; /* ファイル内のオフセット */
Elf64_Xword sh_size; /* セクションのサイズ */ 
Elf64_Word sh_link; /* 別のセクションへのリンク */
Elf64_Word sh_info; /* 雑多な情報 */ 
Elf64_Xword sh_addralign; /* アドレス整列の境界 */
Elf64_Xword sh_entsize; /* セクションにテーブルがある場合、エントリのサイズ */ 
}Elf64_Shdr；
```

今、私たちが注目すべき領域は
- *sh_name*
- *sh_link*
- *sh_info* 

フィールドです。

まず、sh_nameの詳しい構造は[[ELF_Format.pdf]]を参照し、上で使ったreadelfコマンドを使ってバイナリを見ると、次のような名前のSectionを見ることができるでしょう。

```bash
# readelf -a global
Section Headers：
  [Nr] Name Type Address Offset
       Size EntSize Flags Link Info Align
  .
  .
  [ 2] .text PROGBITS 00000000000000000000 00000060
       00000000000000000029 0000000000000000 AX 0 0 0 1
  [ 3] .rela.text RELA 00000000000000000000 00000260
       00000000000000000030 00000000000000000018 I 10 2 8
```


```bash
# readelf -a hello
Section Headers:
  [Nr] Name Type Address Offset
       Size EntSize Flags Link Info Align
  .
  .
  [10] .rela.dyn RELA 0000000000000550 00000550
       00000000000000c0 0000000000000018 A 6 0 8
  [11] .rela.plt RELA 0000000000000610 00000610
       0000000000000018 0000000000000018 AI 6 24 8
```

次のように .rel または .rela が前に付いている場合、その Section が ==再配置可能==であることを意味する。

次に sh_link と sh_info の場合 sh_type によって下の図のように様々な意味で使われるようになります、

![image-20231006152734451.png|center](/img/user/kr/CTF/Basic/assets/ELF%20%ED%8C%8C%EC%9D%BC%20%ED%98%95%EC%8B%9D%EC%97%90%EC%84%9C%20%EC%9E%AC%EB%B0%B0%EC%B9%98(Relocation),%20%EB%A7%81%ED%82%B9(Linking)%20%EA%B9%8C%EC%A7%80/image-20231006152734451.png)

私たちが関心がある==再配置可能==(.rel, .rela領域)の場合、通常 *Index* を意味します。

Linkingについてもっと説明する前に、全体的な構造を見ると次のようになります。

まず、コンパイルしたSectionの全体情報が次のような場合。

```bash

Section Headers:
  [Nr] Name Type Address Offset
       Size EntSize Flags Link(=sh_link) Info(=sh_info) Align
  [ 0] null 0000000000000000 00000000
       0000000000000000 0000000000000000 0 0 0
  [ 1] .note.gnu.pr[...] NOTE 0000000000000000 00000040
       0000000000000020 0000000000000000 A 0 0 8
  [ 2] .text PROGBITS 0000000000000000 00000060
       0000000000000029 0000000000000000 AX 0 0 1
  [ 3] .rela.text RELA 0000000000000000 00000260
       0000000000000030 0000000000000018 I 10 2 8
  [ 4] .eh_frame PROGBITS 0000000000000000 00000090
       0000000000000058 0000000000000000 A 0 0 8
  [ 5] .rela.eh_frame RELA 0000000000000000 00000290
       0000000000000030 0000000000000018 I 10 4 8
  [ 6] .data PROGBITS 0000000000000000 000000e8
       0000000000000004 0000000000000000 WA 0 0 4
  [ 7] .bss NOBITS 0000000000000000 000000ec
       0000000000000000 0000000000000000 WA 0 0 1
  [ 8] .comment PROGBITS 0000000000000000 000000ec
       000000000000002e 0000000000000001 MS 0 0 1
  [ 9] .note.GNU-stack PROGBITS 0000000000000000 0000011a
       0000000000000000 0000000000000000 0 0 1
  [10] .symtab SYMTAB 0000000000000000 00000120
       0000000000000120 0000000000000018 11 9 8
  [11] .strtab STRTAB 0000000000000000 00000240
       000000000000001f 0000000000000000 0 0 1
  [12] .shstrtab STRTAB 0000000000000000 000002c0
       000000000000006c 0000000000000000 0 0 1
```

sh_link と sh_info の意味を考えながら、各 Section の図を描くと次のようになる。

![image-20231006154233302.png|round](/img/user/kr/CTF/Basic/assets/ELF%20%ED%8C%8C%EC%9D%BC%20%ED%98%95%EC%8B%9D%EC%97%90%EC%84%9C%20%EC%9E%AC%EB%B0%B0%EC%B9%98(Relocation),%20%EB%A7%81%ED%82%B9(Linking)%20%EA%B9%8C%EC%A7%80/image-20231006154233302.png)

実際の再配置に必要な情報を持つ Symbol Table Section と Relocation Section は [[jp/CTF/Basic/ELF ファイル形式からRelocation Linkingまで#File header\|上]] のようにそれぞれエントリで構成されています。

![image-20231006184427053.png|round](/img/user/kr/CTF/Basic/assets/ELF%20%ED%8C%8C%EC%9D%BC%20%ED%98%95%EC%8B%9D%EC%97%90%EC%84%9C%20%EC%9E%AC%EB%B0%B0%EC%B9%98(Relocation),%20%EB%A7%81%ED%82%B9(Linking)%20%EA%B9%8C%EC%A7%80/image-20231006184427053.png)



## Symbol Table Entry(.symtab)
まず、Symbol Table SectionのEntryは次のようになります。

```c
typedef struct
Elf64_Word st_name; /* Symbol name */ Symbol name 
unsigned char st_info; /* 型とバインディング属性 */ 
unsigned char st_other; /* Reserved */ 
Elf64_Half st_shndx; /* セクションテーブルインデックス */ 
Elf64_Addr st_value; /* シンボル値 */
Elf64_Xword st_size; /* オブジェクトのサイズ (例: common) */ 
}Elf64_Sym；
```

各Entryは一つのシンボルに対する情報を持って名前、タイプ、値、どのSection(Section index)に存在するかで構成されます。
## Relocation Entry(.rela, .rel)
次に、Relocation SectionのEntryは次のようになります。
```c
typedef struct
{
Elf64_Addr r_offset; /* リファレンスのアドレス */ 
Elf64_Xword r_info; /* Symbol index and type of relocation */ 
}Elf64_Rel；

typedef struct
{
Elf64_Addr r_offset; /* 参照先のアドレス */ 
Elf64_Xword r_info; /* シンボルインデックスと再配置のタイプ */
Elf64_Sxword r_addend; /* 表現式の定数部分 */
}Elf64_Rela；
```


Rellocation Entryは二つの種類で構成され、実際にRellocationが適用されるメモリアドレスのオフセット(r_offset)、どのようにRellocationが行われるべきか(r_info)、最後にメモリアドレスを計算するときに追加する値(r_addend)で構成されます。

今回では.relaを中心に説明します。
## Address Calculation
実際のアドレスの計算は[[jp/CTF/Basic/ELF ファイル形式からRelocation Linkingまで#Relocation Entry(.rela, .rel)\|Relocation Entry]]章で説明した r_info を利用して行われます。

r_infoは再配置を行うシンボルテーブルのインデックスと==適用する再配置タイプ(どのように再配置するかについての情報)==を持ちます。
>[!info]- r_info
>具体的には、各上位のビットと下位のビットを用いて、テーブルのインデックスやタイプなどを表します。
>```c
>#define ELF32_R_SYM(info)             ((info)>>8)
>#define ELF32_R_TYPE(info)            ((unsigned char)(info))
>#define ELF32_R_INFO(sym, type)       (((sym)<<8)+(unsigned char)(type))
>#define ELF64_R_SYM(info)             ((info)>>32)
>#define ELF64_R_TYPE(info)            ((Elf64_Word)(info))
>#define ELF64_R_INFO(sym, type)       (((Elf64_Xword)(sym)<<32)+ (Elf64_Xword)(type))					
>```																
								
x86の場合、以下のような再配置方法が存在します。

| 再配置のタイプ |再配置を実行するフィールドのサイズ|加算する値を計算する方法       |
| ------------------------------------------------------------------------------ | --- | ----- |
| R_X86_64_PC32                                                                  | 32  | S+A-P |
| R_X86_64_64                                                                    | 64  | S+A   |
| ...                                                                            | ... | ...   |


この他にも[[Thread Local Storage Explained\|TLS(Thread Local Storage)]]やDynamic Linkingなどのための様々な方式が存在する。

ここで登場するS, A, Pはそれぞれ
- S: 再配置後のシンボルの実際の位置。
	- 計算式: ([[kr/CTF/Basic/assets/ELF 파일 형식에서 재배치(Relocation), 링킹(Linking) 까지/st_value 의미\|st_value]]) + シンボルが定義されたセクションがロードされたアドレス
- P: 再配置すべき部分の位置
	- 計算式: r_offset + 再配置を行うセクションがロードされたアドレス
- A: 加算される値 = r_addend

ここまで、再配置に使われるデータの種類と使い方、そして再配置の実際のメモリアドレス値を計算する方法まで見てきました。

それでは、実際の計算がどのように行われるのか見てみましょう。
## Procedure
使用するプログラムは[[jp/CTF/Basic/ELF ファイル形式からRelocation Linkingまで#실습 준비\|2 番目の実習用のプログラム(Global)]]を使います。

まず、readelfプログラムでSection, Relocation entryに関する情報、Symbol Tableに関する情報を確認しましょう。

```bash
# Section
----------------------------------------------------------------------------------
Section Headers:
  [Nr] Name              Type             Address           Offset
       Size              EntSize          Flags  Link  Info  Align
	.
	.
  [ 2] .text             PROGBITS         0000000000000000  00000060
       0000000000000029  0000000000000000  AX       0     0     1
  [ 3] .rela.text        RELA             0000000000000000  00000260
       0000000000000030  0000000000000018   I      10     2     8
	.
	.
  [ 6] .data             PROGBITS         0000000000000000  000000e8
       0000000000000004  0000000000000000  WA       0     0     4

# Relocation
----------------------------------------------------------------------------------
Relocation section '.rela.text' at offset 0x260 contains 2 entries:
  Offset          Info           Type           Sym. Value    Sym. Name + Addend
00000000000a  000900000002 R_X86_64_PC32     0000000000000000 global_var - 8
00000000001e  000a00000004 R_X86_64_PLT32    0000000000000000 func_A - 4

# Symbol Table
----------------------------------------------------------------------------------
Symbol table '.symtab' contains 12 entries:
   Num:    Value          Size Type    Bind   Vis      Ndx Name
	.
	.
     8: 0000000000000000     0 FILE    LOCAL  DEFAULT  ABS global.c
     9: 0000000000000000     4 OBJECT  GLOBAL DEFAULT    6 global_var
    10: 0000000000000000    21 FUNC    GLOBAL DEFAULT    2 func_A
    11: 0000000000000015    20 FUNC    GLOBAL DEFAULT    2 start
```

次はデコンパイルを次のようなコマンドで実行してみましょう。

```bash
DESKTOP objdump -d global

-d: decompile .text section
```

```bash
Disassembly of section .text:

0000000000000000 <func_A>: 
   0:   f3 0f 1e fa             endbr64
   4:   55                      push   %rbp
   5:   48 89 e5                mov    %rsp,%rbp
   8:   c7 05 00 00 00 00 7b    movl   $0x7b,0x0(%rip)        # 12 <func_A+0x12>
   f:   00 00 00
  12:   90                      nop
  13:   5d                      pop    %rbp
  14:   c3                      ret

0000000000000015 <start>:
  15:   f3 0f 1e fa             endbr64
  19:   55                      push   %rbp
  1a:   48 89 e5                mov    %rsp,%rbp
  1d:   e8 00 00 00 00          call   22 <start+0xd>
  22:   b8 00 00 00 00          mov    $0x0,%eax
  27:   5d                      pop    %rbp
  28:   c3                      ret
```

まず、実際のオフセットが計算されるメモリアドレスを確認するために.rela.textのEntryのr_offset値を確認すると次のようになります。

- ==00000000000a== 000900000002 R_X86_64_PC32 00000000000000000000 global_var - 8
- ==00000000001e== 000a00000004 R_X86_64_PLT32 00000000000000000000 func_A - 4

それぞれのアドレスが0xa, 0x1eであることが分かり、形式がR_X86_64_PC32, R_X86_64_PLT32で32bit分のメモリを変更することが分かります。

つまり

func_A関数の
  - 8: c7 05 ==00 00 00 00 00== 7b movl $0x7b,0x0(%rip) # 12 <func_A+0x12>.

start 関数の
  - 1d: e8 ==00 00 00 00 00== call 22 <start+0xd> <start+0xd> の

です。

> [!Hint]
> x64のcallとmov命令の形式は以下となる。
> #### CALL
> |Opcode|Instruction|Op/  <br>En|64-bit  <br>Mode|Compat/  <br>Leg Mode|Description|
> |---|---|---|---|---|---|
> |E8 cw|CALL rel16 |M|N.S.|Valid|Call near, relative, displacement relative to next instruction.|
> |E8 cd| CALL rel32|M|Valid|Valid|Call near, relative, displacement relative to next instruction. 32-bit displacement sign extended to 64-bits in 64-bit mode|
>#### MOV
> |Opcode|Instruction|Op/  <br>En|64-Bit  <br>Mode|Compat/  <br>Leg Mode|Description|
> |---|---|---|---|---|---|
> |C7 /0 iw|MOV r/m16 imm16|MI|Valid|Valid|Move imm16 to r/m16.|
> |C7 /0 id|MOV r/m32 imm32|MI|Valid|Valid|Move imm32 to r/m32.|





意味的には変数をメモリにmovする命令、start関数で他の関数をcallする命令のターゲット(オファランド)となるアドレスを変更し
変数のアドレスをglobal_varのアドレスに、callする関数のアドレスをfunc_Aのアドレスに変更するということになります。

さて、（ついに！）r_offsetがマスクするアドレスの値を計算してみましょう。

目標はグローバル変数であるglobal_varのアドレスの計算とfunc_Aのアドレスをそれぞれ計算することです。

計算を進める前に、まず頭の中で絵を描いておきましょう。

私たちが求める最終的な目標は、メモリの値の変化であり、具体的には、現在実行中の命令のアドレスからターゲットとなる変数や関数のアドレスをメモリの値として入れることです(案外簡単です)。

func_AのR_X86_64_PLT32形式の場合、Dynamic Linkingに関連するので、`global_var`を中心に見てみましょう。
### global_var
まず、*global_var*を対象に今まで説明した内容を利用して値を計算してみましょう。

全体の構造は次のようになります。
![image-20231010151410269.png|center](/img/user/kr/CTF/Basic/assets/ELF%20%ED%8C%8C%EC%9D%BC%20%ED%98%95%EC%8B%9D%EC%97%90%EC%84%9C%20%EC%9E%AC%EB%B0%B0%EC%B9%98(Relocation),%20%EB%A7%81%ED%82%B9(Linking)%20%EA%B9%8C%EC%A7%80/image-20231010151410269.png)

計算式は次のようになります。
Address: <span class="green">S</span> + <span class="blue">A</span> - <span class="yellow">P</span>。
上記の[[jp/CTF/Basic/ELF ファイル形式からRelocation Linkingまで#Address Calculation\|計算式]]をもう少し解くと次のようになります。
$$
\color{green} st\_value + .data \color{blue} + r\_append \color{yellow} - (r\_offset + .text )
$$
計算結果は $\text{0x0 + 0xE8 + (-8) - (0x0A + 0x60)= 0x76}$ です。

この値を実際に入れてどのように解釈されるか見てみましょう。

```bash
Before
-------------
c7 05 00 00 00 00 00 7b mov DWORD PTR [rip+0x0],0x7b

After
------------
c7 05 76 00 00 00 00 7b mov DWORD PTR [rip+0x76],0x7b
```

現在進行中のコマンドアドレス(rip)から0x76を加算していることが分かります。

movコマンドを実行しているとき、ripの値は0x12(次に実行するコマンドのアドレスを指す) + 0x60(.textアドレス)であることが分かる。

$\text{0x72+0x76 = 0xE8}$ で *globar_var* のアドレスを指していることが分かる。




# Dynamic Linking
## 開始前
Dynamic Linkingの場合、理論的な部分と実際に動作する部分でRelocationと違いがあります。

特に、Dynamic Linkingを聞いたときに考える共有ライブラリとのリンク過程の場合、その違いが明確になります。

違いが発生する根本的な理由は、Relocationの場合、オペレーティングシステムがプログラムをメモリにロードする過程で発生し、ライブラリとのリンクはプログラムが動作している間に発生 [^1]します。

詳しく説明すると話が長くなり、動作中ではなくプログラムの起動時にリンクが行われるなど、色んな設定によって様々なケースが存在するので、Dynamic Linkingの場合は

- Dynamic Linkingに必要なSectionとEntryの構造と関係性
- Dynamic Liningが起こる過程

を分けて説明します。
## Dynamic Symble Table Entry(.dynsym)
構造の場合、[[jp/CTF/Basic/ELF ファイル形式からRelocation Linkingまで#Symbol Table Entry(.symtab)\|Symbol Table Entry]]と同じ構造を持ち、構造体も同じ構造体を持ちます。

Symbol Table Entryのように図で表すと次のようになります。
![image-20231025113003181.png|round](/img/user/kr/CTF/Basic/assets/ELF%20%ED%8C%8C%EC%9D%BC%20%ED%98%95%EC%8B%9D%EC%97%90%EC%84%9C%20%EC%9E%AC%EB%B0%B0%EC%B9%98(Relocation),%20%EB%A7%81%ED%82%B9(Linking)%20%EA%B9%8C%EC%A7%80/image-20231025113003181.png)


`.dynsym` の値を `readelf` コマンドで読み込むと次のようになります。
```bash
# readelf --dyn-syms hello
Symbol table '.dynsym' contains 7 entries：
   Num: Value Size Type Bind Vis Ndx Name
     0: 00000000000000000000 0 NOTYPE LOCAL DEFAULT UND
     1: 00000000000000000000 0 FUNC GLOBAL DEFAULT UND _[...]@GLIBC_2.34 (2)
     2: 0000000000000000 0 NOTYPE WEAK DEFAULT UND _ITM_deregisterT[...]@GLIBC_2.34 (2)
     3: 0000000000000000 0 FUNC GLOBAL DEFAULT UND puts@GLIBC_2.2.5 (3)
     4: 0000000000000000 0 NOTYPE WEAK DEFAULT UND __gmon_start__ (4)
     5: 0000000000000000 0 NOTYPE WEAK DEFAULT UND _ITM_registerTMC[...]...
     6: 0000000000000000 0 FUNC WEAK DEFAULT UND [...]@GLIBC_2.2.5 (3)
```


`stdio.h` ライブラリで `printf` 関数を使用すると、 `libc` 関連の関数が Symbol Table にあることが分かる。

次に `.rela.dyn` を見てみると、 `.dynsym` と同じ `.rela, .rel` 構造体を共有しています。

```
Relocation section '.rela.dyn' at offset 0x550 contains 8 entries：
  Offset Info Type Sym.Value Sym.Name + Addend
000000003db8 000000000008 R_X86_64_RELATIVE 1140
000000003dc0 000000000008 R_X86_64_RELATIVE 1100
000000004008 000000000008 R_X86_64_RELATIVE 4008
000000003fd8 000100000006 R_X86_64_GLOB_DAT 0000000000000000 __libc_start_main@GLIBC_2.34 + 0
000000003fe0 000200000006 R_X86_64_GLOB_DAT 0000000000000000 _ITM_deregisterTM[...] + 0
000000003fe8 000400000006 R_X86_64_GLOB_DAT 0000000000000000 __gmon_start__ + 0
000000003ff0 000500000006 R_X86_64_GLOB_DAT 0000000000000000 _ITM_registerTMCl[...] + 0
000000003ff8 000600000006 R_X86_64_GLOB_DAT 0000000000000000 __cxa_finalize@GLIBC_2.2.5 + 0
```


実習ファイルの場合、二つのタイプ(`R_X86_64_RELATIVE`, `R_X86_64_GLOB_DAT`) が存在することがわかります。


## .dynamic
`readelf` コマンドで読み込んだ結果、 `.dynamic` フィールドが存在することがわかります。
`.dynamic` フィールドの場合、セクションヘッダに `PT_DYNAMIC` フラグが設定されたセクションで、通常 `.dynamic` という名前を持つ。

`.dynamic` フィールドは実際にプログラムがメモリにロードされる際に Dynamic Linking に必要な情報を含み、主に `.plt, .got` のように Dynamic Linking に必要な他のセクションのアドレスを持つ。

保存される構造体は以下の通りです。
```c
typedef struct {
	Elf64_Sxword d_tag；
   	union {
   		Elf64_Xword d_val；
   		Elf64_Addr d_ptr；
	} d_un；
d_un; }Elf64_Dyn；
``` 

構造体は `d_tag` によって `d_val` または `d_ptr` として（unionですので）意味を持つ構造体になる。
詳細な内容は [[kr/CTF/Basic/assets/ELF 파일 형식에서 재배치(Relocation), 링킹(Linking) 까지/ELF64_Dyn 의미\|ここを参照してください]].

簡単に `readelf` で読み込んだ結果を見ればすぐに理解できる。

```bash
# readelf -a hello
Dynamic section at offset 0x2dc8 contains 27 entries：
  Tag Type Name/Value
 0x00000000000000000001 (NEEDED) 共有ライブラリ：[libc.so.6].
.
.
 0x00000000000000000019 (INIT_ARRAY) 0x3db8 .
.
 0x0000000000000000001a (FINI_ARRAY) 0x3dc0
.
 0x00000000000000000003 (PLTGOT) 0x3fb8 .
.
```

NEEDED フラグが設定された部分は `libc` ライブラリを使用することを意味する。
また、 `STRTAB, SYMTAB, PLTGOT, INIT_ARRAY` に表示される値は、各セクションのアドレスと同じであることがわかる。
```bash
# readelf -a hello
Section Headers：
  [Nr] Name Type Address Offset
       Size EntSize Flags Link Info Align
 .
 [21] .init_array INIT_ARRAY 00000000000000003db8 00002db8
       000000000000000008 0000000000000008 WA 0 0 8
 [22] .fini_array FINI_ARRAY 0000000000003dc0 00002dc0 00002dc0
       0000000000000008 0000000000000008 WA 0 0 0 8
 .
 [24] .got PROGBITS 0000000000003fb8 00002fb8 00002fb8
       00000000000000000048 0000000000000008 WA 0 0 8 .
``` 
### Procedure
次は、実際にDynamic Linkingが行われる過程を見てみましょう。

詳細は[[jp/CTF/Basic/GOT, PLTからDynamic Linking まで\|GOT, PLTからDynamic Linking まで]]で説明します。

# 結論
ELFファイルの形式と実際の実行ファイルがオペレーティングシステムで動作するために必要なリンクプロセスについて説明しました。  
  
リンキング過程の場合、一見複雑に見えますが、ポイントは"メモリにどの部分に変数がマッピングされるか分からないという問題を解決するために登場した"ということです。  
  
どこに存在するか予想できない変数や関数の位置について、[[jp/CTF/Basic/ELF ファイル形式からRelocation Linkingまで#Linking\|計算方法]]と変数や関数が[[jp/CTF/Basic/ELF ファイル形式からRelocation Linkingまで#Linking\|存在するセクション]]、[[jp/CTF/Basic/ELF ファイル形式からRelocation Linkingまで#Linking\|セクションでのオフセット]]などを置いて、実際に必要な時に計算して使うというのが肝心なのです  
  

## 付録: 全体像

### Relocationの流れ
話が長いので、一度に理解するのは難しいかもしれないので、最後に流れをまとめた図を添付します。

必要な場合、横に並べてもう一回読むと理解しやすいと思います。


![image-20231010161636907.png|center](/img/user/kr/CTF/Basic/assets/ELF%20%ED%8C%8C%EC%9D%BC%20%ED%98%95%EC%8B%9D%EC%97%90%EC%84%9C%20%EC%9E%AC%EB%B0%B0%EC%B9%98(Relocation),%20%EB%A7%81%ED%82%B9(Linking)%20%EA%B9%8C%EC%A7%80/image-20231010161636907.png)

[^1]: 下のウイキペディアを[[jp/CTF/Basic/GOT, PLTからDynamic Linking まで\|ダイナミックリンク]]まで理解んた後読んでみよう
- https://en.wikipedia.org/wiki/Relocation_(computing)
- https://en.wikipedia.org/wiki/Program_lifecycle_phase
- https://en.wikipedia.org/wiki/Loader_(computing)
