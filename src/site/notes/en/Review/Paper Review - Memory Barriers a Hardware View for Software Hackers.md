---
{"dg-publish":true,"permalink":"/en/Review/Paper Review - Memory Barriers a Hardware View for Software Hackers/","tags":["paper-review/hwViewForSwHackers","TODO/페이지링크수정필요"],"created":"2024-01-26","updated":"2024-03-16"}
---


# Overview
This article is a summary of the paper "Memory Barriers a Hardware View for Software Hackers" and discusses the underlying reasons why many synchronization issues occur and how to fix them.

Topics covered include

1. the behavior of caches on CPUs with many cores
2. specific methods for maintaining consistency
3. what is a write barrier, read barrier
4. different consistency management techniques for different architectures and how the OS handles architecture consistency regardless of CPU architecture.

*Note:*
1. *May be easier to understand if you read the paper along with the article?
2. the paper refers to the CPU as *Core* in the text
# MESI
## State
The cache of a CPU core has four distinct states

1. Exclusive
	1. the value exists 'exclusively' in the core's cache
2. Modified
	1. the same as Exclusive, the value exists only in the core cache.
	2. but if the value is changed and it has to discard its own value, it is obliged to reflect the value in memory
3. Shared
	1. the value in the cache is shared with other cores
4. Invalid
	1. the cache does not contain anything

## State Diagram
![image-20240126111231050.png|round](/img/user/kr/%EA%B8%B0%EB%A1%9D/%EB%85%BC%EB%AC%B8/assets/Paper%20Review%20-%20Memory%20Barriers%20a%20Hardware%20View%20for%20Software%20Hackers/image-20240126111231050.png)
### State Transitions
The cache state of a core changes depending on the behavior of the core or the behavior between cores.

For example:
1. Core1 has stored the exclusive value A in its cache.
2. if Core2 sends a request to read that value
	1. Core1 tells Core2 what the value of A is
	2. the state transitions to Shared because A is no longer exclusively Core1's value

and so on.
### Message
The aforementioned read request acts as the message that triggers the state transition.

The types of messages are
1. Read: A read request to request cache information from another core.
2. Read Response: an answer to the read request
3. Invalidate: Invalidate the value in the other core's cache (delete the other core's value so that only you can have it)
	1. Invalidate Acknowledge: Acknowledge that you have invalidated
4. Read + Invalidate: Request both Read and Invalidate at the same time (I give you a value and you invalidate it)
	1. naturally, both Read Response and Invalidate Acknowledge are required.
5. Writeback: Write back the value from the cache to memory, which has the effect of freeing up space in the cache.

# Problems and optimizations
MESI allows cores to be consistent about values that they do not share.

However, waiting for each other's request naturally incurs overhead whenever shared resources are used.

## Prob 1: Invalidate + Acknowledgment
Sending a message is basically the same as sending data.

In other words, just as there is latency in data communication on the network, the CPU has to wait for an answer to the request, and that is the overhead.
![Pasted Image 20240126112647_753.png|center](/img/user/kr/%EA%B8%B0%EB%A1%9D/%EB%85%BC%EB%AC%B8/assets/Paper%20Review%20-%20Memory%20Barriers%20a%20Hardware%20View%20for%20Software%20Hackers/assets/Drawing%202024-01-26%2011.26.23.excalidraw/Pasted%20Image%2020240126112647_753.png)

In the above situation, in order to proceed with the write operation on Core0, I need to request Read + Invalidate from the other cores to check if my value is the latest value, and compare my value with the other cores' values.

In other words, there is an overhead of waiting for messages from the other side for comparison.

But *Does Core0 always have to wait for Core1 in the write operation?

In a write operation, my value will be written anyway, regardless of the latest value?

## Store Buffer
This is where the Store Buffer comes in: a buffer to "mark" the value as written without having to wait.

With the introduction of the store buffer, commands that contain a store command can be executed immediately without waiting for a message from the other core.

However, the store buffer alone causes the following problem
![image-20240126114430722.png|center](/img/user/kr/%EA%B8%B0%EB%A1%9D/%EB%85%BC%EB%AC%B8/assets/Paper%20Review%20-%20Memory%20Barriers%20a%20Hardware%20View%20for%20Software%20Hackers/image-20240126114430722.png)
\[R + I = Read + Invalidate. ~~The picture isn't neat enough;;~~\]

Here's a quick summary of the flow

1. through steps 1 - 2 - 3, Core0 executed a = 1 and stored the value 1 in a.
	1. but it was only written to the Store Buffer and not to the Cache.
2. Core1 requests the value of a from Core0 in order to execute b = a + 1
	1. Core0 naturally hands over the value that exists in the cache (the value of a in the cache is 0)
3. Core1 executes b = 0 + 1 and throws an error

The above problem is caused by a mismatch between the value in the Store Buffer and the value in the cache.

To solve this problem, we introduced a mechanism to check the values in the store buffer and cache.

### Peephole Cache (with Store Forwarding)
![image-20240126130150249.png|center](/img/user/kr/%EA%B8%B0%EB%A1%9D/%EB%85%BC%EB%AC%B8/assets/Paper%20Review%20-%20Memory%20Barriers%20a%20Hardware%20View%20for%20Software%20Hackers/image-20240126130150249.png)

By creating the above structure, the problem is solved as follows.

Let's start again from 2. above

1. core1 requests the value of a from core0 to execute b = a + 1
	1. Core0 naturally passes the value that exists in its cache (the value of a in the cache is 0), but checks the Store buffer before doing so
	2. checks the store buffer to see if it contains a
	3. passes the value in the store buffer, not the value in the cache
2. Core1 executes ~~b = 0 + 1 and gets an error~~ executes b = 1 + 1 and everyone is happy
## Store Buffer and the Write Problem
While it would be nice if everything went smoothly, there is still a problem that hasn't been solved.

The problem is that *Core1 doesn't know the state of Core0's Store Buffer*.

You might be thinking, *What? Didn't you just say it could know?* 

Let's take one step back and check a unique case below.
![image-20240126131223962.png|center](/img/user/kr/%EA%B8%B0%EB%A1%9D/%EB%85%BC%EB%AC%B8/assets/Paper%20Review%20-%20Memory%20Barriers%20a%20Hardware%20View%20for%20Software%20Hackers/image-20240126131223962.png)

If executed in this order
1. a = 1 is stored in Core0's Store Buffer and it requests R + I from other CPUs
	1. b immediately updates its cache because it is the only one it has
2. Core1 requests the value of b, which does not exist in its cache, via a "Read" message in order to execute b == 0.
3. Core0 passes the requested value of b (b = 1) to Core1
	1. currently, Core0 has a in its store buffer and b in its cache.
4. Core1 looks up the value of a to execute a == 1
5. since a already exists in Core1's cache, the value is available immediately
6. assert(a == 0) fails because Core1 has a value of 0.
7. the R + I value requested by Core0 arrives late.

Exquisite cases like above can occur.

Naturally, Core0 will execute Read + Invalidate to get the value of a as its own, but Core1's code will be executed before it is invalidated, causing a problem.

The root cause of this problem is that by introducing Store Forwarding, we are guaranteed to get the latest value when we request a Read from someone else,

But, *Core1 doesn't check the other core's store buffer when Core1 uses it's own value, which can cause inconsistencies in the data between each core*.

Now you can see that there is a contradiction somewhere.

1. You can't tackle Core1 is using it's own value
2. Because, to solve this problem Core1 needs to check the value is exclusive, every time it use the value.
3. If we do check every time, then why we use Store Buffer?
# Memory Barrier
So how can we solve this problem?

The answer is simple.

We just need to actually operate the operations that we have only "marked" in the *Store Buffer.

Then the problem in the example above will not occur. Let's take a quick look

1. Core0 requests R + I to execute a = 1 ~~Store Buffer and it requests R + I from another Core~~
	1. updates its cache immediately because b is exists in it, exclusively
	2. *wait for R + I* to reflect a = 1 in Core1's cache
2. Core1 requests the value of b, which does not exist in its cache, via a "Read" message to execute b == 0.
3. Core0 passes the requested value of b (b = 1) to Core1
	1. currently, Core0 a, b are in it's cache  ~~a is in its store buffer~~.
4. Core1 looks up the value of a to execute a == 1
5.  It requests the value from Core0 because it is in Invalid state ~~a already exists in Core1's cache, it can use the value immediately~~ 
6. the requested value arrives and Core1 can pass the assertion with a = 1

These operations cannot be handled automatically by the CPU and must be handed over to the programmer, because the CPU cannot know the dependencies between variables.

The **Memory Barrier** operation is provided to allow the programmer to control these data dependencies.
![image-20240126132335820.png|center](/img/user/kr/%EA%B8%B0%EB%A1%9D/%EB%85%BC%EB%AC%B8/assets/Paper%20Review%20-%20Memory%20Barriers%20a%20Hardware%20View%20for%20Software%20Hackers/image-20240126132335820.png)

`smp_mb()` means to reflect all the values in the Store Buffer.

## Invalidate Queue
While the previous problem solved the overhead for *writes*, let's look at the techniques introduced to solve the overhead for *reads*.

Another overhead that can be introduced by a multi-core configuration is the need to wait for Invalidate messages.

Every time we do a read, we have to send a Read + Invalidate message to make sure it's the most recent value, and then wait for the Invalidate message to arrive.

 The overhead comes from this waiting. Consider a situation where Core1 is busy when Core0 sends a Read + Invalidate to Core1.

 Core1 will Invalidate its cache to process this R + I message and send the Read value. It then has to process the Invalidate message while it is busy.
 
And if it needs to use the invalidated value again, it will have a cache miss (~~Double overhead!~~)

To solve this problem, we introduced the Invlidate Queue, which stores Invalidate messages as they are received.

Now, when the CPU receives an Invalidate message, it stores the Invalidate message in the Invalidate Queue and sends an Invalidate Acknowledgment instead of actually invalidating it.

The problem that the Invalidate Queue solves is that you don't have to invalidate every time an Invalidate message arrives.

The idea is to reduce overhead by just "marking" the cache line as invalidated and not actually invalidating it every time.

![image-20240129170224559.png|center](/img/user/kr/%EA%B8%B0%EB%A1%9D/%EB%85%BC%EB%AC%B8/assets/Paper%20Review%20-%20Memory%20Barriers%20a%20Hardware%20View%20for%20Software%20Hackers/image-20240129170224559.png)

## Invalidate Queue and Read Problem
The Invalidate Queue we've read about so far has many similarities to the Store Buffer mentioned earlier.

Before we move on, let's organize them a little bit based on their commonalities, because they can get confusing.

1. Both mark a request when it comes in, instead of actually processing it
2. Both reply to the request with a message that request is handled, regardless of whether the request is actually handled or not
3. this results in
	1. Reduces overhead
	2. Creates value gap between core

So we can ask the same questions about Invlidate Queue as we did about Store Buffer.

Is it okay to send an Invalidate Acknowledgment without *actually performing the invalidate.*

The problem starts with this question.

The values in the Invalidate Queue are the values that should be invalidated in the future.

What happens if the CPU does not invalidate a value that should be invalidated?

The CPU cannot be sure that the values it uses in its cache are truly up-to-date.

What if the CPU thinks it is the most recent value and uses it?

![image-20240129172817797.png|center](/img/user/kr/%EA%B8%B0%EB%A1%9D/%EB%85%BC%EB%AC%B8/assets/Paper%20Review%20-%20Memory%20Barriers%20a%20Hardware%20View%20for%20Software%20Hackers/image-20240129172817797.png)

1. Core0 executes a = 1
	1. it sends R + I to Core1 because it is in shared state
2. Core1 has no value for b, so it sends a Read request to Core0 to execute b == 0
3. Core1 puts Core0's I + R request into the Invalidate Queue and immediately replies with an Invalidate Acknowledgment
	1. a = 0 is still in Core1's cache without actually invalidating it (Core1 is too busy to invalidate it right now)
4. Core0 has b in its cache, so it immediately reflects the value b = 1 into its cache
5. Core0 sends b = 1 in response to Core1's Read request
	1. Core1 can escape While(b == 0)
6. Core1 executes assert(a == 1), which uses the value in its cache without any constraints since a == 1 only reads the value of a
	1. Core1 is too busy to check the Invalide Queue and the value of a is zero
7. assert fails

(What a situation...)
# Memory Barrier Again
So how can we solve the above problems?

The answer is exactly the same as the solution mentioned in Store buffer, the problem we just encountered would be solved if 'a' in the Invalidate Queue was actually invalidated.

If a had been invalidated, the assert() would not have failed because a would have been invalidated when we executed a == 1 in step 6, and we would have been able to make a Read request to Core0 to reflect the latest value.

Just like the Store buffer, we can actually invalidate the values that were only 'marked' as invalidated.
![image-20240129173616455.png|center](/img/user/kr/%EA%B8%B0%EB%A1%9D/%EB%85%BC%EB%AC%B8/assets/Paper%20Review%20-%20Memory%20Barriers%20a%20Hardware%20View%20for%20Software%20Hackers/image-20240129173616455.png)

# Read and Write Memory Barrier
The Memory Barriers described above are actually related to two operations, Read and Write.
We use the terms Read Memory Barrier and Write Memory Barrier for Read and Write respectively.

- Write Memory Barrier: Guarantee that writes are actually reflected
- Read Memory Barrier: Guarantee the most recent value for read

Using these words, we can replace the code in the image above with the following

![image-20240129173952458.png|center](/img/user/kr/%EA%B8%B0%EB%A1%9D/%EB%85%BC%EB%AC%B8/assets/Paper%20Review%20-%20Memory%20Barriers%20a%20Hardware%20View%20for%20Software%20Hackers/image-20240129173952458.png)

If the code is written like this, the assert will not throw an error.

Let's think about the code, before step forward.

The condition assumes that foo and bar are being executed by their respective cores, just as in the previous case

>[!info]- Answer
> The worst case is that an assert statement is thrown
> So far, assertions have occurred in the following situations
> 1.  the value a = 1 is not actually *written*.
> 2.  the value *read* for a == 1 is not up to date
>
> With the introduction of memory barriers, the above conditions are solved as follows
> 1. the write barrier guarantees that a is 1(a = 1) at the time b = 1 is executed.
> 	 1. This prevents the case where it hasn't actually been *written*.
> 2. the Read barrier guarantees that the value of a read for a == 1 always reflects the most recent value of a
> 	1. i.e. if a = 1 was *actually* written, we can guarantee that the read value of a will always be *1*.
> 	2. (conversely, if it was never actually written, it could be 0 or 1)


# Appendix
We have seen how the MESI protocol can be used to ensure cache consistency on CPUs with many cores.

Next, we discussed the overhead of ensuring consistency and the various optimizations that have been introduced to address it.

Finally, we discussed the side effects of optimizations and what techniques exist and how they can be used to address them.

We've covered all but the last of the five goals we set out to accomplish in this article.

In the appendix, we'll cover the final topic, CPU implementation(=architecture), which is a bit of a mixed bag, and how memory barriers are handled in operating systems.
## Memory Reordering and Execution Ordering
Although we didn't mention it in detail in the article, there is a strong correlation between memory barriers and the CPU's instruction execution order.

*Note:* Before reading this section, please note
1. this is not the same as Out-of-Order Execution that you usually learn about when studying computer architecture
	1. out of order centers on processing variables that are not dependent on each other in a pipeline.
	2. this is about behavior when multiple cores interfere with a single variable in memory.
2. although we didn't mention it before, we have already seen out of order execution when looking at Store Buffer and Invalidate Queue.
	1. before reading further, let's go back and think about it
	2. specifically, let's go back to [[en/Review/Paper Review - Memory Barriers a Hardware View for Software Hackers#Store Buffer\|Store Buffer]] and focus on what the actual order of behavior is
	




Below, we'll focus on an example from Store Buffer to see how the actual sequence of actions changes.

![image-20240126131223962.png|center](/img/user/kr/%EA%B8%B0%EB%A1%9D/%EB%85%BC%EB%AC%B8/assets/Paper%20Review%20-%20Memory%20Barriers%20a%20Hardware%20View%20for%20Software%20Hackers/image-20240126131223962.png)

1. a = 1 is stored in Core0's *Store Buffer* and requests R + I from Core1
	1. Core0 updates value of b immediately, because b is exclusive
2. Core1 requests the value of b, which does not exist in its cache, via a "Read" message in order to execute b == 0.
3. ...

The hidden answer to changing the execution order is the above two sentences.

That is, independent of the actual instructions executed by Core0, to an outside observer, a = 1 has not yet been reflected and only b = 1 has been executed.

This execution order is what we call a  *memory reorder*.

Imagine that the above code is just a combination of Load and Store (or Read and Write).

Core0 would execute like
1. store( or wrote) the number 1 into a variable called a, and
2. store 1 in a variable named b

In the procedure above, programmer's intention was ignored and b = 1 was executed first.

Because Core0 was exchanging messages with Core1.

This situation is called *Store Reordered After Store*.
## Architecture-specific features
The problem is that the memory reordering allowed by this CPU is *architecture specific* ;;;

![image-20240316131112220.png|center|300](/img/user/kr/%EA%B8%B0%EB%A1%9D/%EB%85%BC%EB%AC%B8/assets/Paper%20Review%20-%20Memory%20Barriers%20a%20Hardware%20View%20for%20Software%20Hackers/image-20240316131112220.png)
\[~~Holy - moly Guacamole!!~~\]

The reason for this architecture-specific nature is *optimization*.

Different companies have different ways of handling instructions...

We'll look at the simplest [x86](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html) architecture as an example here 

To keep it simple, we'll just look at load after load and store after store.

![image-20240316132454514.png](/img/user/kr/%EA%B8%B0%EB%A1%9D/%EB%85%BC%EB%AC%B8/assets/Paper%20Review%20-%20Memory%20Barriers%20a%20Hardware%20View%20for%20Software%20Hackers/image-20240316132454514.png)
\[Source - Intel® 64 Architecture Memory Ordering white paper\]

The behavior that x86 does not allow is the following

First, if store after store(unauthorized behavior) is executed in 

1. mov \[\_y\], 1 is executed first
	1. currently \[\_y\] == 1, \[\_x\] == 0 is stored
2. processor 1 is executed
	1. r1 == 1 and r2 == 0

Next, we can think about the load after load

1. mov r2, \[\_x\] is executed first
2. next, Processor0 is executed
	1. currently \[\_x\] == 1 \[\_y\] == 1
3. next, mov r2, \[\_x\] is executed
4. r1 == 1, r2 == 0

This means that this behavior is not allowed on x86.

However, as briefly mentioned in the table above, there are CPUs with architectures that allow all of these behaviors!!!

But are we programming with these CPU architectures in mind, or are we not?

How is that possible?
## How operating systems and languages deal with memory
The reason why we don't learn this stuff when we learn any language or study any operating system is simple.

It's because the interfaces provided by the operating system and the language are naturally *abstracted* enough.

Linux provides functions that give you direct control over these memory barriers.

However, in many synchronization-related functions we use, we don't usually think about this, because the functions are written so that we can write synchronization code for any number of cases, regardless of architecture!

In addition, more and more languages support multi-threading, which also takes into account the architecture of the CPU.

That's why programming languages also provide features that take into account the memory model.

## Learn more
1. [What are the memory barrier instructions provided by Intel?](https://www.intel.com/content/dam/www/public/us/en/documents/manuals/64-ia-32-architectures-software-developer-vol-2b-manual.pdf)
2. Challenge yourself to read the paper!
	1. Read more about the SPARC architecture, especially the CPUs introduced in the paper.
3. If you want to know more???..[[kr/운영체제/동기화의 본질 - SW와 HW 관점에서\|동기화의 본질 - SW와 HW 관점에서]]
# References
1. https://www.puppetmastertrading.com/images/hwViewForSwHackers.pdf