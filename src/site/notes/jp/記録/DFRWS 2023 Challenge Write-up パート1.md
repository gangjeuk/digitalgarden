---
{"dg-publish":true,"permalink":"/jp/記録/DFRWS 2023 Challenge Write-up パート1/","created":"2025-02-07","updated":"2025-02-07"}
---

![[image-20250210154557360.png \| center]]


# 参考リンク
- Problem github: https://github.com/dfrws/dfrws2023-challenge
- Write-up github: https://github.com/gangjeuk/DFRWS2023-The-Troubled-Elevator-solve

# 雑談
最近書いた[[kr/일기/2025-02-07 (근황 및 일정 설명)\|記事]]で話したDFRWS 2023 Write-upをやっとアップロードします。少し前に結果が出たので、やっとWrite-upをアップすることができました。

可能であれば、レポートまで共有できればいいのですが、この部分は後日、チームメンバーの同意を得てアップできるようになったらアップする予定です！

長かったら長かった、短かったら短かった大学院生活で私が残した結果を皆さんと共有できることを本当に嬉しく思います。

どれだけの方が読んでくれるかはわかりませんが、もしかしたら、セキュリティやフォレンジックに興味がある方に興味を持ってもらえるような文章になればいいなと思い、Write-upを作成しました。

それでは、さっそく説明を始めたいと思います。

# 問題の説明
まず、問題に対する理解のため、軽くでも問題リンクに乗って概説を読むのが正確なので、詳細はリンクを参考していただければと思います。

概略的に問題について説明するため、問題を2つの部分に分けて**問題のストーリー**と、**主なフォレンジック対象(ターゲット)**を分けて説明すると理解が少し楽になると思います。

**主なフォレンジック対象**の場合、PLC(Programmable Logic Controller)というハードウェアを対象行います。PLCの場合、複雑に考える必要はなく、私たちの回りにある一般的なパソコンまたは組み込みシステムと考えてください。

ただ、違いがあるとすれば、PLCの場合、様々な産業現場などの信頼性が重要なところで使われるということです。

代表的には、私たちが日常的に使っているエレベーターや船舶などのコントロールのために使われるのが特徴です。

![[image-20250210155639658.png \| center]]

もう一つの特徴として、単純な組み込みシステムと区別される部分は、スクラッチ(Scratch)と似たインターフェースを通して(プログラマーで言うとCode editorのような感じ?)プログラミングができるということです。

(もちろんPLCの方がもう少し専門知識が必要です、Flop、and \| or \| xorゲートなど)

![[image-20250210160311846.png \| center]]
\[PLCハードウェアイメージ］

はい、なんとなく頑丈そうなこの物体がPLCです。

PLCは先ほど申し上げたように、パソコン(コンピュータ)だと考えてください。つまり、コンピュータのようにInput / Calculate / Outputが存在し、Inputを受けてCalculationを実行し、結果をOutputで出力することになります。

例として上記のPLCが使用されるエレベータを1階から移動して2階に到着する過程でPLCの動作を見れば理解しやすいと思います。

1. 2階に到着したことを検出するセンサーのInputがPLCに入力される
2. 2階に到着した時のロジックをPLCで実行します
3. 実行されたロジックによってエレベータのドアを操作するモーターにOutputで信号を出力する
4. Outputの信号をモーターが受け取ってモーターを動作し、ドアが開く

また、組み込みシステムと同じように（もう少し詳しく言えば、Arduinoプログラミングと同じように）プログラミングされます。

1. 上記のプログラミングインターフェースでプログラムを作成
2. コンパイルされたバイナリをPLCに保存します。
3. 保存したバイナリをPLCが実行

といった感じです。

問題はこのPLCがハッキングされた状況を調査することが主なシナリオです。

ストーリーを単純に要約すると、ある会社が敵対的買収により他の架空の会社を食い潰そうとすることと、 このような会社の行動が気に入らない人々がハッカーを雇い、雇ったハッカーが犯した事件を調査するのが私たちの課題になります。

もう少し詳しく===3行で===要約すれば

1. CEOが敵対的M&Aをしようとしている。
2. このCEOが気に入らない人がハッカーを雇って脅迫メールを送るなど、とてもとても悪い行為をした。
3. 契約当日、CEOが会議場に行くために乗ったエレベーターをハッキングして誤動作を起こす。

といった感じです。

ストーリーでは、ハッカーはエレベータをコントロールするPLCを攻撃対象にしてCEOが会議に参加できないようにしてしまい、私たちはどのような方法と経路で攻撃が行われたのかを調査することになります。

# PLCに関する背景知識
Write-upをスムーズに理解するために、PLCに関するいくつかの背景知識が必要になります。

まず、PLCプログラミングに関連する内容を少しだけ追加して解説を続けるとよいと思います。

### PLCの動作単位
まず、プログラミングの基本単位である==関数==のような概念がPLCにも存在しますが、PLCではこれをRungと呼びます。

![[image-20250210162608056.png \| center]]
\[出典 - https://ladderlogicworld.com/programmable-logic-controller-plc-basics/\]

Rungは、関数と同様に、開始点（Rungの左側）のInputと、終点（Rungの右側）のOutputで構成され、PLCは、各Rungを順次無限に実行する役割を果たします。

ここで、Rungの動作が無限であるという概念が少し分かりにくいので、もう少し詳しく説明します。 (システムプログラミングやプログラミングで言うpoll(またはpolling)方式と似ているので、その知識を知っていれば少し簡単に理解することができます)

まず、先ほど例に挙げた1階から2階へ向かうエレベータをもう一度思い出しながら説明を続けます。

エレベータを操作するPLCは各階の到着を検出できるInputセンサーを持っている場合、エレベータの動作のためのRungは次のようにプログラムすることができます。

- 2階到着センサーをInputとして、Outputとしてエレベータの上下動作を担当するモーターをOffにするRung。
	- 2階に到着したというセンサーのinputによってエレベータを止めるために使用することができます。
- モーター動作状態と到着センサー、2つのInputをInputとして、Outputとしてエレベータのドア動作をOnまたはOffするRung。
	- エレベータが到着し、動きが停止した状態でエレベータのドアを開くために使用することができます。

上のRungは私が任意に作った一種の例で、様々なプログラムを作成することができます。しかし、ここでは重要なPLCの2つの特徴に注目すると、解説が少し理解しやすくなると思います。

1. 各InputとOutputは特定の状態のOn / Offとして管理される。
	- もう少し具体的には、特定のメモリの一つのビットとして管理されます。
2. Inputが一種の条件文として動作するようになる。
	- つまり、Inputの条件が合わなければロジックの実行とOutputでの出力が行われます。

これらの特徴を踏まえて、エレベータを操作するPLCロジックを作るとしたら、例に挙げた2つのRungの他に、次のようなRungを書くことができるでしょう。

- 1階到着を検知するRung
- 2階到着を検知するRung
- ... 階の到着を検知するRung
- n階の到着を検知するRung
- エレベータのドアの開閉を調節するモーターの動作を設定するRung
- エレベータの上下を調節するモーターの動作を設定する Rung
- etc...

PLCはこれらのRungを繰り返しながら、Inputの条件が満たされた時に該当するRungを動作させます。まるで、2階到着センサーが到着を検出しなければ動作しないRungのようにね ;)

そして、Inputの条件が合わなければ、次のRungを実行させ、このような行為をPLCは続けて繰り返すことになります。

今まで説明したRungをもしコードに置き換えると、下記のようにまとめることができそうです。

``` c
func Rung1(elevator_sensor_input_bit) { 
	// elevator_sensor_input_bit is a value of input sensor connected to PLC
	if(elevator_sensor_input_bit){ 
		// ここでロジックを実行

		// エレベータが2階に到着したことを記録するためのメモリビットを設定します。
		set_output_bit(elevator_position_at_2nd_floor_bit, True)
	}
	return 0
}

func Rung2(input_bit1, input_bit2) {
	// input_bit はもっと複雑なものかもしれません。
	// センサーの入力値やエレベータの昇降モーターの入力値など、もっと複雑なものにすることも可能です。
	// なので、以下のifステートメントの意味は、以下のように訳すことができます、
	// エレベーターがある階に到着し、上下モーターが動いていないときにドアを開ける。
	if(input_bit1 && !input_bit2){
		// ドア開放ロジックを実行する
		set_output_bit(move_door_motor_bit, True)
		
		// エレベータのドアオープンタイマを想像してください。
		timer(5)

		// 最後にドアを閉める
		set_output_bit(move_door_motor_bit、False)
	}
	return 0
}

func Rung3(){
...
}


func main() { ...
	// Loop Rungs
	while(1){
		Rung1(elevator_sensor_input_bit)；
		Rung2(elevator_sensor_input_bit, elevator_up_down_motor_bit)
		Rung3(...)
		// ...
		RungN(...)
	}
}
```

### PLC関連雑談 (解説とは関係ない..)
もともとPLC自体はすごく古いものですが、問題を解きながら調べてみると、思ったより学会でホットなテーマの一つで少し驚きました。

問題解決のために色んな論文を探しながら感じた傾向は、最近PLCのようなレガシーハードウェアが"インターネットに接続され始め、ハッキングなどの脅威にさらされ始めた\~\~"という感じでIoT分野と同じように脆弱性の発見などが行われている分野になっているようです。

また、当然のことながら、問題出題者の論文も探してみましたが、関連論文を出していることを確認し、問題解決に多くのヒントを得ることができました。 興味のある方は、論文も探してみると、もう少し面白く解説を読むことができると思います。

# PLCとネットワーク(UMASプロトコル)
PLCに関する最後の背景知識として、PLCに保存されたプログラムなどを更新するために使用されるUMASプロトコルについて簡単に説明します。

## UMAS (Modbus / TCP based protocol)
まず、UMASというプロトコルに不慣れな方が多いと思います。 私もChallengeの内容を勉強しながら初めて知ったので、勉強しながら課題を進めました。

具体的なプロトコルの規約と関連した公式文書を説明するより、簡単にUMASに関連した内容を列挙する方が分かりやすいと思います。

まず、結論だけ簡単に要約すると、UMAS(Unified Messaging Application Services)プロトコルはPLC、もっと具体的にはChallengeで提示されたSchneider Electric社のPLCの設定変更、プログラムアップデート、バイナリアップデートなどの設定のために使われるプロトコルだと考えてください。

Application Serviceという名前から分かるように、アプリケーション階層に位置することが予想できるでしょう。

下層のModbus / TCPというプロトコルの上で成立しますが、単純にTCP / IPの上で成立すると考えていただいても構いません。

> [!info]
> 1.Modbusプロトコルは、産業界で広く使われている通信プロトコル（Fieldbusという名前で通称されます）と考えてください。
> 2.シリアル通信からTCP/IP上のアプリケーション層まで様々な仕様が定義されている珍しいプロトコルです。

Challengeでも、与えられたファイルの中でネットワークログを調べると、PLCのIPアドレスを対象にUMAS通信が行われていることが確認できます。

![[image-20250211165746666.png \| center]]

## UMASの詳細
UMASの詳細とともに、Challengeで与えられたワイヤーシャークファイル(.pcapファイル)を見やすくするためには、以下のアドレスを参照してください。

1. UMAS分析1: https://ics-cert.kaspersky.com/publications/reports/2022/09/29/the-secrets-of-schneider-electrics-umas-protocol/
2. UMAS分析2: http://lirasenlared.blogspot.com/2017/08/the-unity-umas-protocol-part-i.html
3. Luaコード: https://github.com/gangjeuk/DFRWS2023-The-Troubled-Elevator-solve/blob/main/4.%20Modbus%20Wireshark/modbus.lua
	1. 上のコードはUMASを分析したUMAS分析を行った著者が作成した内容に加えて追加的なコードを少し加えたWireshark用luaスクリプトです。

Write-upの理解のために簡単にUMASについて説明すると、UMASは基本的にFunction codeとそれに関連するデータを送信してPLCを操作することになります。

![[image-20250211170705075.png \| center]]

例えば、PLCの特定のメモリ領域にデータを書きたい場合は、Function codeを0x29に設定し、書きたいデータをDataに一緒に入れて送信する方式と考えてください。

| **UMAS Function Code** | **Function**           |
| ---------------------- | ---------------------- |
| 0x24                   | Read Coils Registers   |
| 0x29                   | Write to memory blocks |
| 0x4                    | Read PLC Information   |
| 0x12                   | Keep Alive Message     |
| 0x2                    | Request a PLC ID       |
\[UMASのファンクションコードと動作例\]一覧表

その他にも、PLCのハードウェア情報を取得したり、PLCのレジスタの値をRead/Writeする場合、現在のPLCの状態を確認するなどの機能をUMASでは定義しています。

詳しい関数コードとその意味は上記のluaコードにまとめてあります。

## 5つの解決課題と3つのファイル
ここまでPLC関連の説明を理解するのに大変お疲れ様でした👏👏👏。まず、Challengeの内容説明と私が担当したパートと解決した問題の内容を簡単にまとめることでWrite-up part 1を終わります。

Challengeで与えられたファイルは大きく3種類で
1. PLCメモリダンプデータ
2. 警告メールが届いたCEOのデスクトップの画像ファイル。
3. PLCに送られてきたネットワークログ(ワイヤーシャークデータ)

で構成されています。

解決課題は、PLCがどのように操作されたか、犯人たちの攻撃のタイムラインなどを構成する問題で構成されました。

結論から言いますと、ファイル全部を詳しく調べましたが、特異な脆弱性(例えば、CVEを利用した攻撃)などは存在しませんでした。

そのため、Challengeの主な問題がPLCメモリダンプを解釈することが主な課題になります。 そして、私が主に担当した部分がPLCなので、次のpart 2では攻撃のタイムラインを簡単に説明し、PLCを解釈した過程について説明します。

