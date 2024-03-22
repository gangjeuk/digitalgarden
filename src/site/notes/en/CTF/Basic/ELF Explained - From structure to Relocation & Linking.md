---
{"dg-publish":true,"permalink":"/en/CTF/Basic/ELF Explained - From structure to Relocation & Linking/","tags":["CTF/basic/ELF"],"created":"2023-10-10","updated":"2023-11-14"}
---

# Reference

https://www.sco.com/developers/gabi/2012-12-31/contents.html
https://intezer.com/blog/malware-analysis/executable-and-linkable-format-101-part-3-relocations/
https://docs.oracle.com/cd/E19683-01/817-3677/chapter6-42444/index.html

# ELF Format
The Executable and Linking Format (ELF) has three main types

1. *relocatable file* → file with code and data to create executable or shared object file
2. *executable file* → a file suitable for creating (executing) a process.
3. *shared object file* → a file that has data and code for linking.

>[!info]
>Linking. It literally means connecting something with.
>It's a word we often use to describe linking to libraries, dynamic linking, and so on.
>Let's break down the terminology a bit further.
> 1. Generating object file by linking shared object file with relocatable file or another shared object file.
> 2. Combining a shared object file and an executable file to create a process.


However, in the end, we can categorize object files based on the big roles of *Linking* and *Execution*.

Here's an illustration of the roles

![image-20231005122731689.png|center](/img/user/kr/CTF/Basic/assets/ELF%20%ED%8C%8C%EC%9D%BC%20%ED%98%95%EC%8B%9D%EC%97%90%EC%84%9C%20%EC%9E%AC%EB%B0%B0%EC%B9%98(Relocation),%20%EB%A7%81%ED%82%B9(Linking)%20%EA%B9%8C%EC%A7%80/image-20231005122731689.png)
- ELF Header: Have a ''road map'' of the file's organization
	- ELF file format, architecture of the executing machine, etc.
- Section header table: contains information about the sections of the file.
	- entry address of each section, entry name, section size, etc.
	- Files used for linking, such as the reloaction file, must be present.
	- Not required for files used for execution, such as an executable file.
- Section: Contains information for linking object files.
	- Instruction, data, symbol table, relocation information, etc.
- Program header table: contains information about how the process should be executed on the system.
	- Required for executable files such as executable files
	- Naturally, it is not needed for files that are not interested in being executed, such as relocation files.
- Segment: A structure consisting of multiple sections.

A Segment is a structure composed of multiple sections, just as described above.

For example, a segment containing data, commonly referred to as a Data Segment, consists of the following sections

| Data Segment | Description |
| ------------ | --------------------------- |
| .data | Initialized data |
| .dynamic | Dynamic linking information |
| .got | Global offset table |
| .bss | Uninitialized data |



# Preparing for the lab
## Hello World!!(Executable file)
Create a simple binary for the lab below.

For the purpose of this lab, we wrote a program that prints Hello, World!! and compiled it.

```c
// title: hello.c
#include <stdio.h>

int main(){
        char* hello = "Hello, World!!";
        printf("%s\n", hello);
        return 0;
}
```

The compilation went like this
```bash
gcc hello.c -o hello
```
## Global(Linking)
Created a simple binary to demonstrate linking, as shown below.

The program looks like this
```c
// title: global.c

int global_var = 1;

void func_A(void){
        global_var = 123;
}

int start(void)
}
        func_A();
        return 0;
}
```

```bash
gcc -c -ffreestanding global.c

#-c: create object file
#-ffreestanding: compile without library
```



# Data Structure
For each of the headers and structures introduced above, let's take a look at what they actually consist of.

First, the Data Type is

![image-20231006122304854.png|center](/img/user/kr/CTF/Basic/assets/ELF%20%ED%8C%8C%EC%9D%BC%20%ED%98%95%EC%8B%9D%EC%97%90%EC%84%9C%20%EC%9E%AC%EB%B0%B0%EC%B9%98(Relocation),%20%EB%A7%81%ED%82%B9(Linking)%20%EA%B9%8C%EC%A7%80/image-20231006122304854.png)

## File header
```c
typedef struct
}
unsigned char e_ident[16]; /* ELF identification */
Elf64_Half e_type; /* Object file type */
Elf64_Half e_machine; /* Machine type */
Elf64_Word e_version; /* Object file version */
Elf64_Addr e_entry; /* Entry point address */
Elf64_Off e_phoff; /* Program header offset */
Elf64_Off e_shoff; /* Section header offset */
Elf64_Word e_flags; /* Processor-specific flags */
Elf64_Half e_ehsize; /* ELF header size */
Elf64_Half e_phentsize; /* Size of program header entry */
Elf64_Half e_phnum; /* Number of program header entries */
Elf64_Half e_shentsize; /* Size of section header entry */
Elf64_Half e_shnum; /* Number of section header entries */
Elf64_Half e_shstrndx; /* Section name string table index */
} Elf64_Ehdr;

```
For file headers
- Magic Number: ELF...
- Machine: x86, ARM, MIPS, ...
- Operating System: Linux, Unix, System V
and more.

Detailed field information and a list of flags such as `e_flags` can be found on page 5 of [[ELF_Format.pdf]].

The values of interest here are *e_phoff* and *e_shoff*, which indicate the location of the section header and program header, which will be covered in the upcoming [[kr/CTF/Basic/ELF 파일 형식에서 재배치(Relocation), 링킹(Linking) 까지#Section header entry\|Section]] and [[kr/CTF/Basic/ELF 파일 형식에서 재배치(Relocation), 링킹(Linking) 까지#Program\|Program]].

Each header consists of an entry and has the following structure

![entries.png|center](/img/user/kr/CTF/Basic/assets/ELF%20%ED%8C%8C%EC%9D%BC%20%ED%98%95%EC%8B%9D%EC%97%90%EC%84%9C%20%EC%9E%AC%EB%B0%B0%EC%B9%98(Relocation),%20%EB%A7%81%ED%82%B9(Linking)%20%EA%B9%8C%EC%A7%80/entries.png)
### Section header entry
First, the structure of the section entry has the following structure.

```c
typedef struct
}
Elf64_Word sh_name; /* Section name */
Elf64_Word sh_type; /* Section type */
Elf64_Xword sh_flags; /* Section attributes */
Elf64_Addr sh_addr; /* Virtual address in memory */
Elf64_Off sh_offset; /* Offset in file */
Elf64_Xword sh_size; /* Size of section */
Elf64_Word sh_link; /* Link to other section */
Elf64_Word sh_info; /* Miscellaneous information */
Elf64_Xword sh_addralign; /* Address alignment boundary */
Elf64_Xword sh_entsize; /* Size of entries, if section has table */
} Elf64_Shdr;
```
The first fields to look at in Section are *sh_type*, *sh_flags*.

sh_type literally determines the type of the Section.
Section types include NULL sections that contain nothing, sections that hold the linker's symbolic information, and sections that hold dynamic linking information.

Depending on the above sh_type, the characteristics of a Section are different, and sh_flags are the representation of them.

In the case of sh_flags, there are flags that determine whether a Section is in memory, writable, etc.

Let's look at a simple example

#### Example
With any binary, you can get information about a section simply by running the following command

```bash
readelf -a hello
```

Let's look at the most representative areas: .text, .rodata, and .data.

```bash
Section Headers:
  [Nr] Name Type Address Offset
       Size EntSize Flags Link Info Align
---------------------------------------------------------------------
  [16] .text PROGBITS 0000000000001060 00001060
       0000000000000113 0000000000000000 AX 0 0 16
  .
  .
  [18] .rodata PROGBITS 0000000000002000 00002000
       0000000000000013 0000000000000000 a 0 0 4
  .
  .
  [25] .data PROGBITS 0000000000004000 00003000
       0000000000000010 0000000000000000 wa 0 0 8
```

This can be organized as follows

| Field name | Flags |
| ---------- | ----- |
| .text | AX |
| .rodata | A |
| .data | WA |

The meaning of each flag is as follows
```bash
Key to Flags:
  W (write), A (alloc), X (execute), M (merge), S (strings)...
```

A simple interpretation is that rodata, which is read-only data, is loaded into memory but cannot be written to (obviously!).

In the case of data, which is normal data, it is of course loaded and can be written.

Finally, text is loaded into memory but can only be read, not written.
### Program header entry
An entry in the program header table is structured as follows.
```c
typedef struct
{
Elf64_Word p_type; /* Type of segment */
Elf64_Word p_flags; /* Segment attributes */
Elf64_Off p_offset; /* Offset in file */
Elf64_Addr p_vaddr; /* Virtual address in memory */
Elf64_Addr p_paddr; /* Reserved */
Elf64_Xword p_filesz; /* Size of segment in file */
Elf64_Xword p_memsz; /* Size of segment in memory */
Elf64_Xword p_align; /* Alignment of segment */
} Elf64_Phdr;
```
In the program header table, we see the word ==Segment== for the first time, and as mentioned above, a Segment is a collection of several Sections.

This explains why the word Segment appears in the Program header table: the Program header table is literally there to set how the ==Program== should set the permissions for the memory area when it runs.

To accomplish this, you can see that there are fields for the address of the memory (*P_VADDR*, *P_PADDR*), the size of the memory (*P_MEMSZ*), and the memory flags (*P_FLAGS* - which control reads, writes, etc.).

#### Example
As an example, let's use the same command once again
(with some manipulations to make it easier to see)
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



First, let's look at the configuration of a Segment.

In Segment 05, we see the familiar .data, .bss, .got, etc., which means that this is probably a collection of sections that are loaded into memory and can be written to.

Also, if we look at the LOAD\[5\] region, we can see that the flag is RW, which matches our expectations.

# Linking
Now let's talk about the linking process, which is the crown jewel of running an ELF file or program in the OS.

First, let's recall [[kr/CTF/Basic/ELF 파일 형식에서 재배치(Relocation), 링킹(Linking) 까지#Section header entry\|Section header entry]] from earlier.

The following structures are used

```c
typedef struct
{
Elf64_Word sh_name; /* Section name */
Elf64_Word sh_type; /* Section type */
Elf64_Xword sh_flags; /* Section attributes */
Elf64_Addr sh_addr; /* Virtual address in memory */
Elf64_Off sh_offset; /* Offset in file */
Elf64_Xword sh_size; /* Size of section */
Elf64_Word sh_link; /* Link to other section */
Elf64_Word sh_info; /* Miscellaneous information */
Elf64_Xword sh_addralign; /* Address alignment boundary */
Elf64_Xword sh_entsize; /* Size of entries, if section has table */
} Elf64_Shdr;
```
Now the areas we need to pay attention to are the
- *sh_name*
- *sh_link*
- *sh_info*

fields.

First, refer to [[ELF_Format.pdf]] for the detailed structure of sh_name, and if you look at the binary with the readelf command used above, you should see a section with the following name.

```bash
# readelf -a global
Section Headers:
  [Nr] Name Type Address Offset
       Size EntSize Flags Link Info Align
  .
  .
  [ 2] .text PROGBITS 0000000000000000 00000060
       0000000000000029 0000000000000000 AX 0 0 1
  [ 3] .rela.text RELA 0000000000000000 00000260
       0000000000000030 0000000000000018 i 10 2 8
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

When a section is prefixed with .rel or .rela, it means that the section is ==relocatable==.

Next, sh_link and sh_info have different meanings depending on the sh_type, as shown below,

![image-20231006152734451.png|center](/img/user/kr/CTF/Basic/assets/ELF%20%ED%8C%8C%EC%9D%BC%20%ED%98%95%EC%8B%9D%EC%97%90%EC%84%9C%20%EC%9E%AC%EB%B0%B0%EC%B9%98(Relocation),%20%EB%A7%81%ED%82%B9(Linking)%20%EA%B9%8C%EC%A7%80/image-20231006152734451.png)

For the ==Relocatable== (.rel, .rela regions) that we are interested in, it usually means *Index*.

Before we talk more about linking, let's take a look at the overall structure.

Once compiled, the complete information for a Section looks like this.

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

Thinking about the meaning of sh_link and sh_info, here's a picture of each section.

![image-20231006154233302.png|round](/img/user/kr/CTF/Basic/assets/ELF%20%ED%8C%8C%EC%9D%BC%20%ED%98%95%EC%8B%9D%EC%97%90%EC%84%9C%20%EC%9E%AC%EB%B0%B0%EC%B9%98(Relocation),%20%EB%A7%81%ED%82%B9(Linking)%20%EA%B9%8C%EC%A7%80/image-20231006154233302.png)

The Symbol Table Section and the Relocation Section, which contain the information needed for the actual relocation, are each composed of an entry like [[en/CTF/Basic/ELF Explained - From structure to Relocation & Linking#File header\| File header above]].

![image-20231006184427053.png|round](/img/user/kr/CTF/Basic/assets/ELF%20%ED%8C%8C%EC%9D%BC%20%ED%98%95%EC%8B%9D%EC%97%90%EC%84%9C%20%EC%9E%AC%EB%B0%B0%EC%B9%98(Relocation),%20%EB%A7%81%ED%82%B9(Linking)%20%EA%B9%8C%EC%A7%80/image-20231006184427053.png)



## Symbol Table Entry(.symtab)
First, the entry for the Symbol Table Section is as follows.

```c
typedef struct
{ symbol
Elf64_Word st_name; /* Symbol name */
unsigned char st_info; /* Type and Binding attributes */
unsigned char st_other; /* Reserved */
Elf64_Half st_shndx; /* Section table index */
Elf64_Addr st_value; /* Symbol value */
Elf64_Xword st_size; /* Size of object (e.g., common) */
} Elf64_Sym;
```
Each entry contains information about a single symbol and consists of a name, type, value, and section index.
## Relocation Entry(.rela, .rel)
Next, the Entry for the Relocation Section looks like this

```c
typedef struct
{
Elf64_Addr r_offset; /* Address of reference */
Elf64_Xword r_info; /* Symbol index and type of relocation */
} Elf64_Rel;

typedef struct
{
Elf64_Addr r_offset; /* Address of reference */
Elf64_Xword r_info; /* Symbol index and type of relocation */
Elf64_Sxword r_addend; /* Constant part of expression */
} Elf64_Rela;
```

A relocation entry consists of two types: the offset of the memory address to which the relocation is actually applied (r_offset), how the relocation should proceed (r_info), and finally the value to be added when calculating the memory address (r_addend).

In this article, we will focus on .rela.
## Address Calculation
The actual address calculation is done using r_info, which is described in the [[en/CTF/Basic/ELF Explained - From structure to Relocation & Linking#Relocation Entry(.rela, .rel)\|Relocation Entry]] chapter.

R_INFO has the symbol table indexes that need to be relocated and ==the type of relocation to apply (information about how to relocate it).
>[!info]- r_info
>Specifically, each high and low order bit is used to indicate the index and type of the table.
>```c
>#define ELF32_R_SYM(info)             ((info)>>8)
>#define ELF32_R_TYPE(info)            ((unsigned char)(info))
>#define ELF32_R_INFO(sym, type)       (((sym)<<8)+(unsigned char)(type))
>#define ELF64_R_SYM(info)             ((info)>>32)
>#define ELF64_R_TYPE(info)            ((Elf64_Word)(info))
>#define ELF64_R_INFO(sym, type)       (((Elf64_Xword)(sym)<<32)+ (Elf64_Xword)(type))					
>```	
																							
For x86, the following relocation methods exist

| the type of transposition | the size of the field to perform the transposition | the way to calculate the values to be added |
| ------------- | --------------------------- | ------------------------- |
| r_x86_64_pc32 | 32 | s+a-p |
| r_x86_64_64 | 64 | s+a |
| ... | ... | ... | ... |
In addition to this, there are various methods for [[kr/CTF/Basic/TLS(Thread Local Storage) 구조\|TLS(Thread Local Storage)]] and Dynamic Linking, etc.

Here, S, A, and P stand for
- S: the actual position of the symbol after relocation.
	- Formula: ([[kr/CTF/Basic/assets/ELF 파일 형식에서 재배치(Relocation), 링킹(Linking) 까지/st_value 의미\|st_value]]) + the address of loaded section where the symbol is defined.
- P: position of the part that needs to be relocated
	- Formula: r_offset + the address where the section being relocated is loaded
- A: Value to be added = r_addend

Now you've seen the types of data used for relocations, their usage, and how to calculate the actual memory address value of a relocation.

Now let's see how the actual calculation actually works.
## Procedure
We will use [[kr/CTF/Basic/ELF 파일 형식에서 재배치(Relocation), 링킹(Linking) 까지#실습 준비\|second program(Global)]] as our program.

First, use the readelf program to get information about the Section, Relocation entry, and Symbol Table.

```bash
# Section
----------------------------------------------------------------------------------
Section Headers:
  [Nr] Name Type Address Offset
       Size EntSize Flags Link Info Align
	.
	.
  [ 2] .text PROGBITS 0000000000000000 00000060
       0000000000000029 0000000000000000 AX 0 0 1
  [ 3] .rela.text RELA 0000000000000000 00000260
       0000000000000030 0000000000000018 I 10 2 8
	.
	.
  [ 6] .data PROGBITS 0000000000000000 000000e8
       0000000000000004 0000000000000000 WA 0 0 4

# Relocation
----------------------------------------------------------------------------------
Relocation section '.rela.text' at offset 0x260 contains 2 entries:
  Offset Info Type Sym. Value Sym. Name + Addend
00000000000a 000900000002 R_X86_64_PC32 0000000000000000 global_var - 8
00000000001e 000a00000004 R_X86_64_PLT32 0000000000000000 func_A - 4

# Symbol Table
----------------------------------------------------------------------------------
Symbol table '.symtab' contains 12 entries:
   Num: Value Size Type Bind Vis Ndx Name .
	.
	.
     8: 0000000000000000 0 FILE LOCAL DEFAULT ABS global.c
     9: 0000000000000000 4 OBJECT GLOBAL DEFAULT 6 global_var
    10: 0000000000000000 21 FUNC GLOBAL DEFAULT 2 func_A
    11: 0000000000000015 20 FUNC GLOBAL DEFAULT 2 start
```

Next, let's decompile with the following command.

```bash
DESKTOP objdump -d global

-d: decompile .text section
```

```bash
Disassembly of section .text:

0000000000000000 <func_A>:
   0: f3 0f 1e fa endbr64
   4: 55 push %rbp
   5: 48 89 e5 mov %rsp,%rbp
   8: c7 05 00 00 00 00 7b movl $0x7b,0x0(%rip) # 12 <func_A+0x12>
   f: 00 00 00
  12: 90 nop
  13: 5d pop %rbp
  14: c3 ret

0000000000000015 <start>:
  15: f3 0f 1e fa endbr64
  19: 55 push %rbp
  1a: 48 89 e5 mov %rsp,%rbp
  1d: e8 00 00 00 00 call 22 <start+0xd>
  22: b8 00 00 00 00 mov $0x0,%eax
  27: 5d pop %rbp
  28: c3 ret
```

First, to see the memory address where the actual offset is calculated, we can check the r_offset value of the entries in .rela.text.

- ==00000000000a== 000900000002 R_X86_64_PC32 0000000000000000 global_var - 8
- ==00000000001e== 000a00000004 R_X86_64_PLT32 0000000000000000 func_A - 4

You can see that the addresses are 0xa, 0x1e, and the format is R_X86_64_PC32, R_X86_64_PLT32, which changes the memory by 32 bits.

In other words.

In the func_A function
  - 8: c7 05 ==00 00 00 00== 7b movl $0x7b,0x0(%rip) # 12 <func_A+0x12>

In the start function
  - 1d: e8 ==00 00 00 00== call 22 <start+0xd>


> [!Hint]
> The call and mov commands on x64 have the following format
> #### CALL
> |Opcode|Instruction|Op/ <br>En|64-bit <br>Mode|Compat/ <br>Leg Mode|Description|
> |---|------|------|------|------|---|
> |E8 cw|CALL rel16 |M|N.S.|Valid|Call near, relative, displacement relative to next instruction.|
> |E8 cd| CALL rel32|M|Valid|Valid|Call near, relative, displacement relative to next instruction. 32-bit displacement sign extended to 64-bits in 64-bit mode|
>#### MOV
> |Opcode|Instruction|Op/ <br>En|64-Bit <br>Mode|Compat/ <br>Leg Mode|Description|
> |---|------|------|------|------|---|
> |C7 /0 iw|MOV r/m16 imm16|MI|Valid|Valid|Move imm16 to r/m16.|
> |C7 /0 id|MOV r/m32 imm32|MI|Valid|Valid|Move imm32 to r/m32.|



Semantically, we can change the address that is the target (opcode) for instructions that move a variable into memory, and for instructions that call other functions in the 'start' function.
This means that the address of the variable is changed to the address of 'global_var' and the address of the function to be called is changed to the address of 'func_A'.

Now (finally!) let's calculate the value of the address covered by r_offset.

The goal is to compute the address of the global variable, 'global_var', and the address of 'func_A', respectively.

But before we do the math, let's get a picture in our heads.

The ultimate goal we want is a change of value in memory, specifically the address of the currently executing instruction to the address of the target variable or function (it's simpler than it sounds).

let's focus on `global_var` because R_X86_64_PLT32 type of 'func_A' is related to dynamic linking.

### global_var
First, let's compute a value for *global_var* using what we've learned so far.

The overall structure is as follows
![image-20231010151410269.png|center](/img/user/kr/CTF/Basic/assets/ELF%20%ED%8C%8C%EC%9D%BC%20%ED%98%95%EC%8B%9D%EC%97%90%EC%84%9C%20%EC%9E%AC%EB%B0%B0%EC%B9%98(Relocation),%20%EB%A7%81%ED%82%B9(Linking)%20%EA%B9%8C%EC%A7%80/image-20231010151410269.png)

The formula looks like this
Address: <span class="green">S</span> + <span class="blue">A</span> - <span class="yellow">P</span>
If we rewrite the expression [[en/CTF/Basic/ELF Explained - From structure to Relocation & Linking#Address Calculation\|given above ]]a bit more, it would look like this

$$
\color{green} st\_value + .data \color{blue} + r\_append \color{yellow} - (r\_offset + .text )
$$
The result of the calculation is $\text{0x0 + 0xE8 + (-8) - (0x0A + 0x60)= 0x76}$.

Now let's put this value into practice and see how it is interpreted.

```bash
Before
-------------
c7 05 00 00 00 00 00 7b mov DWORD PTR [rip+0x0],0x7b

After
------------
c7 05 76 00 00 00 7b mov DWORD PTR [rip+0x76],0x7b
```
Notice that we're adding 0x76 to the address of the current instruction (rip).

When executing the mov instruction, we see that the value of rip is 0x12 (indicating the address of the next instruction to be executed) + 0x60 (the address of the .text).

We can see that $\text{0x72+0x76 = 0xE8}$ points to the address of *globar_var*.




# Dynamic Linking
## Before startup
Dynamic Linking differs from Relocation in the way it works in theory and in practice.

This is especially true for the process of linking to shared libraries, which is what you think of when you hear the term dynamic linking.

The fundamental reason for the difference is that relocation occurs when the operating system loads a program into memory, while linking to a library occurs while the program is running[^1].

It would be a long story to explain in detail, and there are many different cases in different settings, such as linking at program startup instead of during operation, so for Dynamic Linking, the

- Structure and relationship of Sections and Entries required for Dynamic Linking
- Process of Dynamic Lining

are explained separately.
## Dynamic Symble Table Entry(.dynsym)
The structure has the same structure as [[en/CTF/Basic/ELF Explained - From structure to Relocation & Linking#Symbol Table Entry(.symtab)\|Symbol Table Entry]] and the structure has the same structure.

This is illustrated as a Symbol Table Entry.
![image-20231025113003181.png|round](/img/user/kr/CTF/Basic/assets/ELF%20%ED%8C%8C%EC%9D%BC%20%ED%98%95%EC%8B%9D%EC%97%90%EC%84%9C%20%EC%9E%AC%EB%B0%B0%EC%B9%98(Relocation),%20%EB%A7%81%ED%82%B9(Linking)%20%EA%B9%8C%EC%A7%80/image-20231025113003181.png)


The value of `.dynsym` is read using the `readelf` command.
```bash
# readelf --dyn-syms hello
Symbol table '.dynsym' contains 7 entries:
   Num: Value Size Type Bind Vis Ndx Name
     0: 0000000000000000 0 notype local default und
     1: 0000000000000000 0 func global default und _[...]@glibc_2.34 (2)
     2: 0000000000000000 0 NOTYPE WEAK DEFAULT UND _ITM_deregisterT[...]
     3: 0000000000000000 0 func global default und puts@GLIBC_2.2.5 (3)
     4: 0000000000000000 0 NOTYPE WEAK DEFAULT UND __gmon_start__
     5: 0000000000000000 0 NOTYPE WEAK DEFAULT UND _ITM_registerTMC[...]
     6: 0000000000000000 0 func weak default und [...]@glibc_2.2.5 (3)
```

By using the `printf` function in the `stdio.h` library, we can see that the `libc`-related functions are in the Symbol Table.

Next, let's look at `.rela.dyn`, which shares the same `.rela, .rel` structures as `.dynsym`.
```
Relocation section '.rela.dyn' at offset 0x550 contains 8 entries:
  Offset Info Type Sym. Value Sym. Name + Addend
000000003db8 000000000008 R_X86_64_RELATIVE 1140
000000003dc0 000000000008 R_X86_64_RELATIVE 1100
000000004008 000000000008 r_x86_64_relative 4008
000000003fd8 000100000006 R_X86_64_GLOB_DAT 0000000000000000 __libc_start_main@GLIBC_2.34 + 0
000000003fe0 000200000006 R_X86_64_GLOB_DAT 0000000000000000 _ITM_deregisterTM[...] + 0
000000003fe8 000400000006 R_X86_64_GLOB_DAT 0000000000000000 __gmon_start__ + 0
000000003ff0 000500000006 R_X86_64_GLOB_DAT 0000000000000000 _ITM_registerTMCl[...] + 0
000000003ff8 000600000006 R_X86_64_GLOB_DAT 0000000000000000 __cxa_finalize@GLIBC_2.2.5 + 0
```

For the lab files, you can see that there are two types (`R_X86_64_RELATIVE`, `R_X86_64_GLOB_DAT`).


## .dynamic
We can see that the `.dynamic` field exists as a result of the `readelf` command.
A `.dynamic' field is a section with the `PT_DYNAMIC` flag set in the section header, usually named `.dynamic`.

The `.dynamic` field actually contains the information needed for dynamic linking when the program is loaded into memory, and usually contains the addresses of other sections needed for dynamic linking, such as `.plt, .got`.

The following structures are stored
```c
typedef struct {
	Elf64_Sxword d_tag;
   	union {
   		Elf64_Xword d_val;
   		Elf64_Addr d_ptr;
	} d_un;
} Elf64_Dyn;
```
The structure will be a structure whose meaning is either `d_val` or `d_ptr`(Remember it's union!!) depending on `d_tag`.
For more information, see [[kr/CTF/Basic/assets/ELF 파일 형식에서 재배치(Relocation), 링킹(Linking) 까지/ELF64_Dyn 의미\|this page]].

A simple `readelf` reading of the result is straightforward.

```bash
# readelf -a hello
Dynamic section at offset 0x2dc8 contains 27 entries:
  Tag Type Name/Value
 0x0000000000000001 (NEEDED) Shared library: [libc.so.6]
.
.
 0x0000000000000019 (INIT_ARRAY) 0x3db8
.
 0x000000000000001a (FINI_ARRAY) 0x3dc0
.
 0x0000000000000003 (PLTGOT) 0x3fb8
.
```
The part with the NEEDED flag set means that the `libc` library is used.
You can also see that the values in `STRTAB, SYMTAB, PLTGOT, INIT_ARRAY` are the same as the addresses in each section.
```bash
# readelf -a hello
Section Headers:
  [Nr] Name Type Address Offset
       Size EntSize Flags Link Info Align
 .
 [21] .init_array INIT_ARRAY 0000000000003db8 00002db8
       0000000000000008 0000000000000008 wa 0 0 8
 [22] .fini_array FINI_ARRAY 0000000000003dc0 00002dc0
       0000000000000008 0000000000000008 WA 0 0 8
 .
 [24] .got PROGBITS 0000000000003fb8 00002fb8
       0000000000000048 0000000000000008 wa 0 0 8
```
### Procedure
Now let's take a look at the actual Dynamic Linking process.

This is covered in more detail in [[en/CTF/Basic/Dynamic Linking Explained - Focusing on GOT, PLT and loader\|Dynamic Linking Explained - Focusing on GOT, PLT and loader]]

# Conclusion
We've covered the format of ELF files and the linking process that is required for the actual executable to work on the operating system.

The linking process sounds complicated, but at its core, it was invented to solve the problem of not knowing where a variable will be mapped in memory.

Record [[en/CTF/Basic/ELF Explained - From structure to Relocation & Linking#Linking\|Calculation Methods]] for variables or functions whose location is unpredictable, and [[en/CTF/Basic/ELF Explained - From structure to Relocation & Linking#Linking\|existing section]], [[en/CTF/Basic/ELF Explained - From structure to Relocation & Linking#Linking\|offset from section]], etc., so that it can be calculated and used when it is actually needed, is the key!

## Appendix: The Big Picture

### Relocation flow
This is a long story, and it can be hard to understand in one sitting, so I'm attaching an illustration of the flow at the end.

You can keep it handy and read it a second time if you need to.


![image-20231010161636907.png|center](/img/user/kr/CTF/Basic/assets/ELF%20%ED%8C%8C%EC%9D%BC%20%ED%98%95%EC%8B%9D%EC%97%90%EC%84%9C%20%EC%9E%AC%EB%B0%B0%EC%B9%98(Relocation),%20%EB%A7%81%ED%82%B9(Linking)%20%EA%B9%8C%EC%A7%80/image-20231010161636907.png)


[^1]: Try to read the pages below, after read the next chapter [[en/CTF/Basic/Dynamic Linking Explained - Focusing on GOT, PLT and loader\|Dynamic Linking Explained - Focusing on GOT, PLT and loader]]
- https://en.wikipedia.org/wiki/Relocation_(computing)
- https://en.wikipedia.org/wiki/Program_lifecycle_phase
- https://en.wikipedia.org/wiki/Loader_(computing)
