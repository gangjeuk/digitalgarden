---
{"dg-publish":true,"permalink":"/jp/記録/論文を読もう - Memory Barriers a Hardware View for Software Hackers/","tags":["paper-review/hwViewForSwHackers"],"created":"2024-01-26","updated":"2024-03-16"}
---


# 概要
この記事は論文'Memory Barriers a Hardware View for Software Hackers'をまとめた記事であると同時に、様々な同期問題が根本的になぜ発生し、エンジニアたちはどのようにこの問題を解決しているのかについて説明します。

この記事で扱うテーマは

1.多数のコアが存在するCPUでのキャッシュの動作
2.一貫性を維持する具体的な方法
3.Write barrier, Read barrierとは何か。
4.アーキテクチャごとに違う整合性管理技法とOSでアーキテクチャによって整合性を処理する方法

Note:
1.文章と一緒に論文を読むと理解しやすいかも？
2.論文ではCPUを*本文ではCoreと呼ぶことにする*。
# MESI
## State
CPUコアのキャッシュの状態は4つに分けられる。

1. Exclusive
	1.自分のコアキャッシュにのみ'Exclusive'にその値が存在
2. Modified
	1.Exclusiveと同じように自分のコアキャッシュにのみその値が存在
	2.しかし、値が変更され、もし自分の値を捨てなければならない場合、メモリに値を反映しなければならない義務がある状態
3. Shared
	1.キャッシュの値が他のコアと共有されている状況
4. Invalid
	1. キャッシュに何も入っていない

## State Diagram
![image-20240126111231050.png|round](/img/user/kr/%EA%B8%B0%EB%A1%9D/%EB%85%BC%EB%AC%B8/assets/Paper%20Review%20-%20Memory%20Barriers%20a%20Hardware%20View%20for%20Software%20Hackers/image-20240126111231050.png)
### 状態遷移
コアのキャッシュの状態は、コアの動作やコア間の動作によって変化する。

例えば：
1.Core1がAという排他的(Exclusive)な値をキャッシュに保存した状態。
2.もしCore2がその値をReadするリクエストを送った場合
	1.Core1がCore2のAの値を知らせる。
	2.AはもうExclusiveでCore1だけが持っている値ではないので、Sharedに状態が遷移する。

というような流れです。
### Message
前述した読み取り要求が状態遷移を誘発するメッセージとして動作します。

メッセージの種類は
1. Read: 読み込みリクエストを行い、他のコアのキャッシュ情報を要求
2. Read Response: 読み取り要求に対する応答
3. Invalidate: 相手コアのキャッシュに存在する値をInvalidにする(自分だけがその値を持つことができるように相手の値を削除する)
	1. Invalidate Acknowledge: Invalidateしたことを確認する。
4. Read + Invalidate: ReadとInvalidateの二つを同時に要求(Readした値を与え、相手はInvalidateにする)
	1.当然、Read ResponseとInvalidate Acknowledge両方の答えが必要。
5.Writeback：キャッシュの値をメモリにWriteback(キャッシュのスペースを確保する効果がある)

# 問題と最適化
MESIを使うと、コアが共有しない値に対して一貫性を維持することができます。

しかし、相手のリクエストを毎回待てば、当然、共有リソースを使うたびにオーバーヘッドが発生しますね。

## Prob 1: Invalidate + Acknowledgement
Messageの送信は基本的にデータの送信と同じです。

つまり、ネットワーク上のデータ通信にもレイテンシーが存在するように、CPUも同じようにリクエストに対する応答を待たなければならず、それがオーバーヘッドとして動作します。
![Pasted Image 20240126112647_753.png|center](/img/user/kr/%EA%B8%B0%EB%A1%9D/%EB%85%BC%EB%AC%B8/assets/Paper%20Review%20-%20Memory%20Barriers%20a%20Hardware%20View%20for%20Software%20Hackers/assets/Drawing%202024-01-26%2011.26.23.excalidraw/Pasted%20Image%2020240126112647_753.png)

上記のような状況でCore0で書き込み動作を行うためには、自分の値が最新の値であることを確認するために、他のCoreにRead + Invalidateを要求し、他のCoreの値と自分の値を比較しなければなりません。

つまり、比較のために相手のメッセージを待たなければならないオーバーヘッドが発生します。

しかし、*書き込み動作でCore0がCore1を常に待たなければならないのでしょうか？

どうせ書き込み動作であれば、最新の値とは関係なく自分の値が使われるのでは？

## Store Buffer
そこで登場したのがStore Bufferで、私が待たずに書いたことを"表示"しておくためのバッファです。

Store bufferの導入により、Storeコマンドを含むコマンドの実行時に、相手のメッセージを待つことなく、Storeコマンドを実行することができるようになりました。

しかし、Store Bufferだけでは以下のような問題が発生します。
![image-20240126114430722.png|center](/img/user/kr/%EA%B8%B0%EB%A1%9D/%EB%85%BC%EB%AC%B8/assets/Paper%20Review%20-%20Memory%20Barriers%20a%20Hardware%20View%20for%20Software%20Hackers/image-20240126114430722.png)
\[R + I = Read + Invalidate. ~~絵が汚い;;~~\]

図の流れを簡単にまとめると以下のようになります。

1. 1 - 2 - 3の過程でCore0がa = 1を実行してaに1という値をStoreしました。
	1. しかし、実際にはStore Bufferにのみ記録され、Cacheには反映されてない状態
2. Core1がb = a + 1を実行するためにCore0からaの値を要求する。
	1. Core0は当然、キャッシュに存在する値を渡します(キャッシュのaの値は0)。
3. Core1 は b = 0 + 1 を実行し、エラーが発生する。

上記の問題はStore Bufferの値とキャッシュに存在する値との間のギャップによって発生します。

この問題を解決するため、Store bufferとCacheの値を互いに確認するメカニズムを導入しました。

### ノ・ゾ・キ キャッシュ(Store Forwardingの導入)
![image-20240126130150249.png|center](/img/user/kr/%EA%B8%B0%EB%A1%9D/%EB%85%BC%EB%AC%B8/assets/Paper%20Review%20-%20Memory%20Barriers%20a%20Hardware%20View%20for%20Software%20Hackers/image-20240126130150249.png)

上記のような構造を作ることで問題は下記のように解決されます。

上記の2.からやり直しましょう。

1. Core1がb = a + 1を実行するためにCore0にaの値を要求する。
	1. Core0は当然、キャッシュに存在する値を渡します~~(キャッシュのaの値は0)~~渡す前にStore bufferを確認します。
	2. Store Bufferにaがあることを確認する。
	3. キャッシュに存在する値ではなく、Store bufferの値を渡す。
2. Core1は~~b = 0 + 1を実行してエラーが発生する~~ b = 1 + 1を実行。(~~めでたしめでたし~~)
## Store Bufferと書き込み問題
全てがうまくいけばいいのですが、まだ解決されていない問題が存在します。

それは*Core1がCore0のStore Bufferの状態を知ることができないという問題です。

*さっきまで分かるって言ってなかったっけ*と思うかもしれませんが、下記の例を見てみましょう。
![image-20240126131223962.png|center](/img/user/kr/%EA%B8%B0%EB%A1%9D/%EB%85%BC%EB%AC%B8/assets/Paper%20Review%20-%20Memory%20Barriers%20a%20Hardware%20View%20for%20Software%20Hackers/image-20240126131223962.png)

このような順番で実行される場合
1. Core0のStore Bufferにa = 1が保存され、他のCPUにR + Iを要求する。
	1. b は自分が唯一持っているので、キャッシュをすぐに更新します。
2. Core1がb == 0を実行するために、自分のキャッシュに存在しないbの値を"Read"メッセージで要求します。
3. Core0は要求されたbの値(b = 1)をCore1に伝えます。
	1. 現在Core0のaはStore bufferに、bはキャッシュに存在する状況です。
4. Core1 が a == 1 を実行するために a の値を探します。
5. aがCore1のキャッシュに既に存在しているので、すぐに値を使うことができます。
6. Core1 が持っている a は 0 なので、assert(a == 0) でエラーが発生します。
7. Core0が要求したR + Iの値が遅れて到着する。

などの絶妙なケースが発生する可能性があります。

当然、Core0はaの値を自分のものにするためにRead + Invalidateを実行するが、Invalidateされる前にCore1のコードが実行され、問題が発生する。

この問題の根本的な原因は、Store Forwardingを導入することで、他者にReadを要求したときに最新の値を受け取れることが保証されるのだが、

*私が持っている値を私が使う時、いちいち相手のStore Bufferを確認しないことで、各コア間のデータにズレが発生する可能性があるということです。

今、どこかで矛盾が発生していることが分かります。

1. 自分のものを自分が使うことにタックルをかけるということはありえない。
2. だからといって、データを使用するたびにすべてのコアのStore bufferの確認手順を持てば、Store bufferを導入した理由がない...
# Memory Barrier
では、この問題をどう解決するのか？

答えは簡単です。

ただ、*Store Buffer*に "表示" "だけ" した演算を実際に反映すればいいのです。

そうすれば、上記の例のような問題は発生しません。簡単に説明します。

1. Core0の~~Store Bufferにa = 1が保存され、他のCoreにR + Iを要求する~~ a = 1を実行するためにR + Iを要求する。
	1. b は自分が唯一持っているので、キャッシュをすぐに更新します。
	2. Core1にa = 1をキャッシュに反映するために *R + Iを待つ*。
2. Core1がb == 0を実行するために、自分のキャッシュに存在しないbの値を"Read"メッセージで要求します。
3. Core0は要求されたbの値(b = 1)をCore1に渡す。
	1.現在Core0の~~aはStore bufferに~~ a、bはキャッシュに存在する状況です。
4. Core1 が a == 1 を実行するために a の値を探します。
5. ~~aがCore1のキャッシュに既に存在するため、すぐに値を使用することができます~~ Invalid状態なので、Core0に値を要求します。
6. 要求した値が到着し、Core1はa = 1でassert文を通過することができます。

このような演算はCPUが自動的に処理することができず、プログラマーに任せる必要があります。なぜなら、CPUは変数間の依存関係を知ることができないからです。

このようなデータの依存性をプログラマが調整しながら使用できるように提供される演算が**Memory Barrier**演算です。
![image-20240126132335820.png|center](/img/user/kr/%EA%B8%B0%EB%A1%9D/%EB%85%BC%EB%AC%B8/assets/Paper%20Review%20-%20Memory%20Barriers%20a%20Hardware%20View%20for%20Software%20Hackers/image-20240126132335820.png)

ここで、`smp_mb()`はStore Bufferの値を全て反映することを意味します。
## Invalidate Queue
先に解決した問題が*書き込み*のオーバーヘッドを解決したら、今回は*読み取り*のオーバーヘッドを解決するために導入された技術について説明します。

多数のコア構成のために発生することができるもう一つのオーバーヘッドは、Invalidateメッセージを待たなければならないということです。

毎回Readをするたびに最新の値であることを確認するためにRead + Invalidateメッセージを送り、Invalidateメッセージが到着するまで待つ必要があります。

 オーバーヘッドはこの待ち時間で発生しますが、もしCore0がCore1にRead + Invalidateを送った時、Core1が忙しい状況を考えてみましょう。

 Core1は(~~忙しいのに~~)このR + Iメッセージを処理するために自分のキャッシュをInvalidateしてReadした値を送ることになります。そうすると、忙しい中、Invalidateメッセージを処理しなければなりません。
 
ところが、Invalidateされた値をもし再使用しなければならない場合、Cache missが発生することになります。(~~二重オーバーヘッドだ!~~)

この問題を解決するために登場したのがInvalidateメッセージを受け取ったらInvalidate Queueを導入することです。

これで、CPUはInvalidateメッセージが来たら、本当のInvalidateをするのではなく、Invalidate QueueにInvalidateメッセージを保存してInvalidate Acknowledgementを送信します。

Invalidate Queueが解決しようとする問題は、Invalidateメッセージが到着するたびにInvalidateをする必要がないことです。

Invalidateされたことを'表示'しておいて、実際にcache lineに対して毎回Invalidateを行わないことでオーバーヘッドを減らすことです。

![image-20240129170224559.png|center](/img/user/kr/%EA%B8%B0%EB%A1%9D/%EB%85%BC%EB%AC%B8/assets/Paper%20Review%20-%20Memory%20Barriers%20a%20Hardware%20View%20for%20Software%20Hackers/image-20240129170224559.png)

## Invalidate Queueと読み取り問題
今まで読んだInvalidate Queueは前述したStore Bufferは似た部分があります。

話を進める前に混乱する可能性があるので、共通点を基準に少しだけ整理しておきましょう。

1. どのようなリクエストが来た時、実際のリクエストに対する処理をするのではなく、表示だけしておきます。
2. リクエストに対する処理の実際の処理の有無に関わらず、処理した旨のメッセージを返信する
3. それによって
	1. オーバーヘッドが減る
	2. コア間のデータのズレが生じる

という共通点が存在する。

ここで、Store Bufferと同じようにInvlidate Queueについても同じ疑問を提示することができます。

つまり、Invalidate Queueに保存だけしておいて、実際InvalidateをしないままInvalidateが進んだとInvalidate Acknowledgementを送ってもいいのか？という疑問です。

問題はこの疑問から始まります。

Invalidate Queueに入ってる値はこれからInvalidateを進めるべき値です。

もし、CPUがInvalidateを進めるべき値をInvalidateしないで使うと？

CPUは自分がキャッシュで使用する値が本当に最新の値であることを確認することができません。

もし、CPUがこの値を最新の値だと思って使ってしまったら？

![image-20240129172817797.png|center](/img/user/kr/%EA%B8%B0%EB%A1%9D/%EB%85%BC%EB%AC%B8/assets/Paper%20Review%20-%20Memory%20Barriers%20a%20Hardware%20View%20for%20Software%20Hackers/image-20240129172817797.png)

1. Core0はa = 1を実行する。
	1. Shared状態なのでCore1にR + Iを送る。
2. Core1にはbの値がないので、b == 0を実行するためにRead要求をCore0に送る。
3. Core1はCore0のI + R要求をInvalidate Queueに入れ、すぐにInvalidate Acknowledgementを返信します。
	1. 実際のInvalidateを行わず、a = 0はまだCore1のキャッシュに残っている(Core1は忙しすぎて今すぐInvalidateを行うことができない)
4. Core0はbをキャッシュに持っているので、b = 1の値をすぐにキャッシュに反映する。
5. Core0はCore1のRead要求に応じてb = 1を送信する。
	1. Core1はWhile(b == 0)を脱出することができます。
6. Core1はassert(a == 1)を実行し、a == 1はaの値をreadするだけなので、別途の制約なしに自分のキャッシュにある値を使用します。
	1. Core1は忙しすぎてInvalide Queueを確認せず、aの値は0です。
7. assertは失敗する

(本当に絶妙な状況です...)
# Memory Barrier Again
では、上記の問題をどうやって解決することができるでしょうか？

正解はStore bufferで言及した解決策と全く同じで、先ほど発生した問題は実際Invalidate Queueにある'a'が実際にInvalidateされれば解決される問題です。

aがinvalidatedされたら、6番でa == 1を実行する時、aがInvalidateされたので、Core0にReadリクエストをして最新の値を反映してassert()が失敗することはなかったはずです。

そう、先ほどのStore bufferと同じように、Invalidate Queueにある値を実際にInvalidateすればいいのです。

つまり、Invalidateされたと'表示'されただけだった値を実際にInvalidateさせることです。
![image-20240129173616455.png|center](/img/user/kr/%EA%B8%B0%EB%A1%9D/%EB%85%BC%EB%AC%B8/assets/Paper%20Review%20-%20Memory%20Barriers%20a%20Hardware%20View%20for%20Software%20Hackers/image-20240129173616455.png)

# Read and Write Memory Barrier
先ほど説明したMemory Barrierは実際、ReadとWriteの二つのOperationに関係しています。
これらのReadとWriteに対して、Read Memory Barrier、Write Memory Barrierという用語を使います。

- Write Memory Barrier: 書き込みを実際に反映させる。
- Read Memory Barrier: 読み出しに対して最新の値を保証する。

上の言葉を使うと、先ほどの図のコードを次のように変更することができます。

![image-20240129173952458.png|center](/img/user/kr/%EA%B8%B0%EB%A1%9D/%EB%85%BC%EB%AC%B8/assets/Paper%20Review%20-%20Memory%20Barriers%20a%20Hardware%20View%20for%20Software%20Hackers/image-20240129173952458.png)

コードが上のように書けば、assertでエラーが発生しないようになります。

一度考えてみましょう。

条件は先ほどの場合と同じようにfooとbarをそれぞれのコアが実行している状況を仮定します。

>[!info]- Answer
> 最悪の状況はassert文が発生することです。
> これまでassert文が発生した状況は以下の通りです。
> 1. a = 1という値が実際に *書き込まれていない*場合。
> 2. a == 1のために *読み取られた*値が最新の値でない場合。
> メモリバリアを導入することで、上記の条件は下記のように解決されます。
> 1. 書き込みバリアにより、b = 1が実行された時点でa = 1であることを保証することができます。
> 	1. つまり、実際に *書き込まれない* 場合を防ぐことができます。
> 2. 読み取りバリアにより、a == 1 のために読み取られた a の値が常に最新の値を反映していることを保証することができます。
> 	1. つまり、a = 1 が 実際に書き込まれた*場合*、*読み込まれた* a の値は常に 1 であることを保証することができます。
> 	2. (逆に言えば、実際に書き込まれていない場合は、0または1である可能性があります) 


# 付録
ここまで、MESIプロトコルを使って、多数のコアを持つCPUでキャッシュの一貫性を保つ方法を見てきました。

次は、一貫性を維持するために発生するオーバーヘッドとそれを解決するために導入された様々な最適化技術について説明しました。

最後に、最適化による副作用と副作用を解決するためにどのような技法が存在し、その技法をどのように使うことができるかを見てみました。

前述したこの記事が目標とした5つの目標のうち、最後を除いたすべてをこの記事で説明しました。

付録では、少し重複する部分と、最後のテーマであるCPUの実装、つまり、アーキテクチャによる特徴について説明し、オペレーティングシステムでどのようにメモリバリアが使われているのかについて説明します。
## メモリオーダーと実行順序の変更(Memory Reordering)
記事では詳しく言及しませんでしたが、実はメモリ障壁とCPUの命令実行順序には大きな相関関係があります。

*Note:* 本セクションを読む前に注意する点
1. よくコンピュータアーキテクチャを勉強する時に学ぶOut-of-Order Executionとは違います。
	1. Out-of-Orderは、パイプライン上で互いに依存関係がない変数に対する処理が中心です。
	2. 本文はメモリに存在する一つの変数に複数のコアが干渉する時の動作が中心です。
2. 説明はしませんでしたが、Store BufferとInvalidate Queueを見ながら、すでに実行順序が変わることを確認しました。
	1. さらに読む前に、前に戻って考えてみましょう。
	2. 具体的には[[jp/記録/論文を読もう - Memory Barriers a Hardware View for Software Hackers#Store Bufferと書き込み問題\|Store Buffer]]に戻って実際の動作の順番がどうなるかを中心にもう一度見てみましょう。
	




以下ではStore Bufferで見た例を中心に実際の動作順序がどのように変わるか見てみましょう。

![image-20240126131223962.png|center](/img/user/kr/%EA%B8%B0%EB%A1%9D/%EB%85%BC%EB%AC%B8/assets/Paper%20Review%20-%20Memory%20Barriers%20a%20Hardware%20View%20for%20Software%20Hackers/image-20240126131223962.png)

1. Core0 の *Store Buffer に a = 1 が保存され、* Core1 に R + I を要求する。
	1. *b は自分が唯一持っているので、キャッシュをすぐに更新する*。
2. Core1 が b == 0 を実行するために、自分のキャッシュに存在しない b の値を "Read" メッセージで要求します。
3. ...

実行順序変更の隠された正解は上記の2つの文です。

つまり、Core0が実際に実行した命令とは別に、外部の観測者にはまだa = 1は反映されていない状態であり、b = 1だけが実行された状況です。

この実行順序がまさにメモリオーダーの変更、つまり、*Memory Reorder*という状況です。

上記コードの命令のLoadとStore(またはReadとWrite)だけで組み合わせられたとしたら。

Core0は
1. aという変数に1という数を保存して(またはStore or Writeして)
2. bという変数に1という数をWriteせよ。

というプログラマの意図を無視して、自分以外のコアであるCore1とのメッセージ交換のため、b = 1を先に実行したのです。

この状況を *Store Reordered After Store* と言います。

プログラマの立場で、問題はここから始まります...。
## アーキテクチャによる特徴
問題はこのCPUが許可するMemory Reorderが*アーキテクチャ*別に相談することです;;;

![image-20240316131112220.png|center|300](/img/user/kr/%EA%B8%B0%EB%A1%9D/%EB%85%BC%EB%AC%B8/assets/Paper%20Review%20-%20Memory%20Barriers%20a%20Hardware%20View%20for%20Software%20Hackers/image-20240316131112220.png)

アーキテクチャごとにこのように相談する特徴を持つ理由は、まさに *最適化* のためです。

会社ごとに違う命令処理方式が原因で起こる問題である...。
(~~ゴオオオオオオ級プログラマーの道は遠くて険しい~~)

私たちはここで一番簡単な[x86を基準にして説明する](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html)

一番簡単にLoad after LoadとStore after Storeの場合だけ見てみましょう。

![image-20240316132454514.png](/img/user/kr/%EA%B8%B0%EB%A1%9D/%EB%85%BC%EB%AC%B8/assets/Paper%20Review%20-%20Memory%20Barriers%20a%20Hardware%20View%20for%20Software%20Hackers/image-20240316132454514.png)
\[出典 - Intel® 64 Architecture Memory Ordering white paper\]]].

x86で許可しない動作は以下の通りです。

まず、Store after Storeで許可されていない動作が実行されると

1. mov \[\_y\], 1 が先に実行されます。
	1. 現在 \[\_y\] == 1, \[\_x\] == 0 が保存されている。
2. Processor 1 が実行される
	1. r1 == 1, r2 == 0 になります。

次に、Load after Load の場合も簡単に考えてみましょう。

1. mov r2, \[\_x\] が先に実行されます。
2. 次に Processor0 が実行される
	1. 現在 \[\_x\] == 1 \[\_y\] == 1 です。
3. 次に mov r2, \[\_x\] が実行されます。
4. r1 == 1, r2 == 0 です。

つまり、x86ではこのような動作は許可されていないのです。

しかし、上記の表で少し触れたように、この全ての動作が許可されるアーキテクチャのCPUも存在します!!!!

しかし、我々はこのようなCPUの構造を意識しながらプログラミングをしているかというと、必ずしもそうでもないようだ。

どうしてそんなことが可能なのだろうか？
## オペレーティングシステムと言語でメモリを扱う方法
実は、どの言語を学んだり、オペレーティングシステムを勉強するときに、このような内容を学ばない理由は簡単だ。

当然のことながら、オペレーティングシステムと言語が提供するインターフェースが適切に*抽象化*されているからです。

Linuxでは、このようなメモリ障壁を直接コントロールできる関数を提供しています。

しかし、私たちが使用する様々な同期に関連する関数で、普段このような内容を意識しない理由は、アーキテクチャに関係なく、すべてのケースを考慮して同期コードを書くことができるように関数内部が書かれているからだ!

また、言語によってマルチスレッド機能をサポートする言語が増えていますが、これらの言語もCPUのアーキテクチャを考慮しないわけにはいきません。

そのため、最近のプログラミング言語はメモリモデルを考慮して機能を提供しています。
## もっと詳しく
1. [Intelで提供しているメモリバリア命令には何があるのか](https://www.intel.com/content/dam/www/public/us/en/documents/manuals/64-ia-32-architectures-software-developer-vol-2b-manual.pdf)
2. 紹介した論文を読んでみよう
	1. 特に論文で紹介されているCPUのうち、SPARCアーキテクチャについて詳しく読んでみよう。
3. さらに読むと良いかも？[동기화의 본질 - SW와 HW 관점에서]]]]
# 参考文献
1. https://www.puppetmastertrading.com/images/hwViewForSwHackers.pdf