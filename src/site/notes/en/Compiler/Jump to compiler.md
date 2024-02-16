---
{"dg-publish":true,"permalink":"/en/Compiler/Jump to compiler/","tags":["Compiler/Jump_to_compiler"],"created":"2024-01-18","updated":"2024-01-18"}
---

# Compiler
```c
#include <stdio.h>

void print_hello(){
	printf("Hello World?\n");
}

int main(){
	print_hello();
	printf("Hello World!\n");
}

```
This is the `Hello World!` function that you see in Chapter 1 of every C language book.

I don't think there are many people  who are interested in how a bunch of strings in a file called `hello_world.c` turns into a single *program* that prints `Hello World!

Or even if they do, it may not be a topic that is easily approachable.

This chapter on compilers aims to help you understand what is Compiler.

By the end of the chapter, we will actually building the Compiler.

## Languages?
We often use the word *programming language*, but what is the *language*?

Of course, we're not linguists, so we don't need to interpret the word *language* through the lens of linguistics.

So, let's choose the definition that suits our engineer's point of view from the following definitions

>[!info]
>There have been many attempts to define language. Here are some of them
>1. the system people use to represent and communicate their thoughts to others.
>2. a system of representing things, actions, thoughts, and states.
>3. a system of shared meanings among people.
>4. a set of grammatically correct words.
>5. a set of words that can be understood within a language community.

\[Source - https://ko.wikipedia.org/wiki/%EC%96%B8%EC%96%B4 \]

Of the above definitions, I think #4 is the best definition to understand the compiler.

But what is the ==grammatical== equivalent?
## Grammar
We can define a language as a set of *symbols* arranged according to *a certain grammar*.

But what are a *certain grammar* and a *certain symbol*?

Let's assume that you are familiar with C and asked to write a simeple program. 

Your body instinctively writes a function without even thinking about it.

```c
int main(int argc, char* argv[]){
...
}
````

Oh! If you had written that sentence right away, you would be considered a native speaker of a language called C.

### Breakdown the function
When we learn C, we usually learn declaration of function like below.

1. first write the return type of the function
2. write the name of the function
3. open the curly brackets (`(`))
4. list the variables you want to use in your function
	1. write the variables in the following format: 'variable type' 'variable name' '`(,)`'
5. close the curly brackets (`)`)
6. open parentheses (`{`)
7. write the function content
8. close the parentheses (`}`)

This is an example of using the language according to grammar.

If you want to define a function in a *language* called C, you need to use the language according to the above syntax.

A compiler is a tool that parses these grammatically correct strings, breaks them down into the building blocks of a language(e.g. functions, variables) and turns them into machine language that fits the building blocks!

# What's next
Let's take a look at what we're going to learn.

1. how a programming *language* is defined.
3. how the *grammar* is defined.
4. how the grammar is divided into elements.
5. how the elements can be translated into machine language

Once you understand these topics and build a compiler, I can *guarantee* that your perspective on languages and computers will be completely changed.

But it's also a difficult topic and there's a lot to learn. It may take me years to get there, but I'll do my best to get there.

Once you've built a simple compiler, it'll be interesting to look at things like compiler optimization, which is a slightly more diverse topic.

