---
{"dg-publish":true,"permalink":"/en/Network/What is VPN - (Simple explanation from PN and IPSEC to  why VPN isn't safe)/","tags":["Network/VPN","Computer-Science"],"created":"2024-04-14","updated":"2024-04-14"}
---


I've been gathering information about VPNs for a project I'm doing in graduate school and realized that there's nothing on the internet that really explains about VPN.

(If you google VPN, all you get are ads ;;;)

# Basic knowledge for reading
Since I haven't written anything about network or cryptographic theory on my current blog, I'll try to make it as easy to understand as possible.

However, in order to read this article, you should have at least a basic understanding of the following

1. IP address acts as an "address" on the internet, like a zip code or house address.
2. Basic knowledge about cryptography:  to encrypt and decrypt files, etc.

The following knowledge will give you a deeper understanding, so if you're interested, search it on the Internet and read the article again.

1. Network Address Translation (NAT).
2. The concept of symmetric and asymmetric cryptography. In particular, how public keys are used to authenticate or share secrets.
3. hash functions and integrity verification.

I won't be covering the concepts on this list in this article, but they're important to know in order to fully understand the concepts behind IPsec.

I'll try to keep cryptography out of this article as much as possible.

Finally, we'll use the word *routing* to refer to the forwarding of data from IP address to IP address, the same as delivering a package from house to house.

This article is targeting people who have zero knowledge about the Network or VPN, and, for people who majored CS, this article will hopefully help you clarify some confusing concepts, so let's dive into VPNs.

# So, what is a Private Network?
Before we talk about VPNs, we need to make sure we understand the following three terms.

1. Network
2. Private
3. Virtual

## Network
We'll cover the word network in a little more detail later when we have a chance, but for now, let's take a quick look at it.

First off, What is Network?

The answer is pretty simple: Network is a *connection*!

(~~I know that sounds unclear, but just calm down for a second and read the story~~)

This may not be immediately obvious, so let's quickly go over it with an example.

Is subway map a Network?

The answer is *yes*, we can say that all of the following are networks

1. the spiderweb-like map of the subway system
2. the supply chain for delivering packages
3. the Internet that you use to deliver data through your home computer
4. the relationships between neighbors and neighbors within a town

Literally anything that can be described as a connection is a network.

In more technical terms, a network can be described as

Network: Connection + *Topology*

Anything that can define a connection and how that connection is made is a network.
## Private
In networking, private means that what happens on the network is secret.

We're going to go back a bit to understand what exactly Private is.
### What is Secret?
The word privacy is not as old as you might think.

Right up until the 19th century, we lived in societies where people lived in village communities and knew how many moles were on their neighbor's back. (This may not particularly true in America; however, just remember we lived in small group of society)

And by the end of the 20th century, we were still using phone books to share the phone numbers of everyone in the country.
![image-20240414102350113.png|center|300](/img/user/kr/%EB%84%A4%ED%8A%B8%EC%9B%8C%ED%81%AC/assets/%EA%B0%80%EB%B3%8D%EA%B2%8C%20%EC%95%8C%EC%95%84%EB%B3%B4%EB%8A%94%20VPN%EC%9D%98%20%EB%B3%B8%EC%A7%88%20-%20(PN%20%EB%B6%80%ED%84%B0,%20IPSEC,%20VPN%EC%9D%B4%20%EC%99%9C%20%EC%95%88%EC%A0%84%ED%95%98%EC%A7%80%20%EC%95%8A%EC%9D%80%EC%A7%80%20%EA%B9%8C%EC%A7%80)/image-20240414102350113.png)
\[Source - https://en.wikipedia.org/wiki/Telephone_directory \]

In the 21st century, it's hard for us to think that our next-door neighbor knows our body secrets, or that everyone in our country knows our home phone number.

You can see that our concept of privacy has changed a lot over the course of history.

To understand Private in the context of VPNs, we'll split the scope of Secret into two parts.

1. privacy in the days when we didn't care if anyone could read what we were sending
2. modern-day privacy, where we need to hide the contents.

### How to make Perfect Private Network?
So, what is the best way to organize a private network?

How can we secretly talk to our friends in neighbor about what we're doing at school tomorrow without our parents and teachers finding out?

How can we build a network that is private and separate from the outside world?

The answer is surprisingly simple

>[!answer]-
> Just lay wires (or communication cables) between people who want to communicate and use them among themselves!!!
> (~~WOW~~~~)


![image-20240414123421979.png|center|240](/img/user/kr/%EB%84%A4%ED%8A%B8%EC%9B%8C%ED%81%AC/assets/%EA%B0%80%EB%B3%8D%EA%B2%8C%20%EC%95%8C%EC%95%84%EB%B3%B4%EB%8A%94%20VPN%EC%9D%98%20%EB%B3%B8%EC%A7%88%20-%20(PN%20%EB%B6%80%ED%84%B0,%20IPSEC,%20VPN%EC%9D%B4%20%EC%99%9C%20%EC%95%88%EC%A0%84%ED%95%98%EC%A7%80%20%EC%95%8A%EC%9D%80%EC%A7%80%20%EA%B9%8C%EC%A7%80)/image-20240414123421979.png)
\[Source - https://www.chegg.com/homework-help/questions-and-answers/two-neighbors-communicate-homemade-string-phone-see-figure--simple-phone-consists-two-ends-q4534276 \]

If you meet the first condition of Secret, you can just connect the people you want to connect with, and it's a private network!

#### But what about a LAN (Local Area Network)?
Well, here's where you might be wondering.

>[!quote]
>'So if I block all external connections on my LAN and only communicate locally, is that a VPN?'

Yes, this is actually a private network.

However, we usually refer to these networks as Closed Networks because they are closed environments that are not connected to the outside world.
## Virtual
In computer science, the word virtual is used in several places.

From the familiar words virtualization and virtual memory to the more recent terms virtual reality (VR) and virtual worlds.

Here we define the word Virtual as follows and let's go from there.

![image-20240414112619192.png|center|240](/img/user/kr/%EB%84%A4%ED%8A%B8%EC%9B%8C%ED%81%AC/assets/%EA%B0%80%EB%B3%8D%EA%B2%8C%20%EC%95%8C%EC%95%84%EB%B3%B4%EB%8A%94%20VPN%EC%9D%98%20%EB%B3%B8%EC%A7%88%20-%20(PN%20%EB%B6%80%ED%84%B0,%20IPSEC,%20VPN%EC%9D%B4%20%EC%99%9C%20%EC%95%88%EC%A0%84%ED%95%98%EC%A7%80%20%EC%95%8A%EC%9D%80%EC%A7%80%20%EA%B9%8C%EC%A7%80)/image-20240414112619192.png)
\[Source - https://en.wikipedia.org/wiki/Brain_in_a_vat \]

>[!info]
>Something that doesn't actually exist, but serves the same purpose as it does

If the above definition is confusing, you can rephrase it as follows.

- Something that is not an operating system that runs on top of real computer hardware, but functions as one.
- Not the real world, but presenting a world that is indistinguishable from the real world.

If we apply this to the private network I created above by connecting wires to communicate with my friend and myself, we get

- Even though friend and I did not carry wires to friend's house to connect the wires, it has the same effect as if we had connected the wires to form a private network.

This is the Virtual + Private Network.
# Virtual Private Network (VPN)
Now let's finally get into the VPN.

And while we're on the subject of VPNs, let's move away from the example of friend  and I skipping school and consider a more realistic example.

## Motivation
Like all engineering in the world, VPNs were created to solve a problem.

That problem is *connecting wires*.

Imagine you work for a company with a private network, and you're traveling abroad for business.

Here are the problems that arise

1. you need to carry thousands of kilometers of wire across the ocean with your computer to connect to your company's private network.
2. how will you connect the wires, and what will be the weight and size of the wires?

In a world where you can open your smartphone and access Google right now, you have to solve the following problems just to connect to your company.

1. network implementation issues: *lugging around wires of enormous size and weight*.
2. cost issues: *how do we price the wires*.

Frustrating, who would want to work for a company if we should carry tons of cables every time we work abroad. 

>[!question]
>Is there really no way to use the internet infrastructure that's already in place to connect to the company like we do to Google or Youtube?

In other words, what if we can connect to the private network from outside the company and give the effect like you are connecting to the private network inside the company.

It is the problem we want to accomplish by using VPNs.

## Setting up a VPN is easy
Now, let's set up the world's simplest VPN environment using the *routing* mentioned above.

Keep in mind, we live in a world with Google and YouTube, but we're talking about people with a late 20th century mindset who don't care if people see what you send them on the internet, and only need to fulfill Secret #1.

Now, as mentioned in the previous chapter, we want to use *an existing internet infrastructure*, and the operators who are building and managing that infrastructure and collecting internet fees from us are called ISPs (Internet Service Prividers). (e.g. SK, KT, Softbank, NTT, AT&T, T-mobile, etc.)

So, the simplest thing you can do to get a VPN is to just talk to your ISP.

1. me and the ISP: "Hey ISP, I'm going to be out of the country for the next week, and I want you to route the information, I sent to my company.
2. me and the ISP: And please don't send (route) any data from the company to anyone else, just to me.
3. ISP: Okay, just give me the money!

That's it, you're done!
![image-20240414135714255.png|center round|350](/img/user/kr/%EB%84%A4%ED%8A%B8%EC%9B%8C%ED%81%AC/assets/%EA%B0%80%EB%B3%8D%EA%B2%8C%20%EC%95%8C%EC%95%84%EB%B3%B4%EB%8A%94%20VPN%EC%9D%98%20%EB%B3%B8%EC%A7%88%20-%20(PN%20%EB%B6%80%ED%84%B0,%20IPSEC,%20VPN%EC%9D%B4%20%EC%99%9C%20%EC%95%88%EC%A0%84%ED%95%98%EC%A7%80%20%EC%95%8A%EC%9D%80%EC%A7%80%20%EA%B9%8C%EC%A7%80)/image-20240414135714255.png)


Now the data I send out will reach my company's network, and my company's data will be out and available only to me.

This is the same effect as if I were at work and using a private network!

(Of course, let's not think about ~~trivial~~ issues like verifying, authenticating, and distinguishing which data was sent by me, and which was really sent by me.)

This created pathway of communication is often called a *Tunnel* and the act of creating a tunnel is called *tunneling* for VPN configuration.
# IPsec - VPN in the wild
If you've made it this far, you should have a general idea of what a VPN is.

Now let's talk about IPsec in the wild and learn more about the types and categorizations of VPNs.

And let's take a quick look at some of the ~~minor~~ issues that we ignored earlier.

## Types of VPNs
Before we dive into IPsec, you should have realized from what you've read so far that VPN is a *concept* in computer networks, not a name for a special service or technology.

This means that there can be many different solutions to the problem depending on the concept of a VPN is intended to solve, and all of them can be called VPNs.

The VPNs are usually categorized according to the functional requirements they solve.
(It is not important to know all of them, but rather to know what characteristics each has and what problem situations they can be used for!)

1. implementation layer: L2, L3, L4, etc.
2. access model: Site-to-Site, Remote Access (person-to-person, person-to-server, server-to-server, etc.)
3. protocols: IPsec, SSL/TLS, PPTP, L2TP, etc.

IPsec usually consists of
1. implementation layer: say that it belongs to the same Internet layer as IP
2. access model: there are *modes* of connectivity: Site-to-Site, Remote Access (person to person, person to server, server to server)
3. protocol: a protocol that supports authentication, encryption, and key exchange functions
## IPsec in a Nutshell
Let's take a quick look at IPsec by looking at the process of connecting to a company from a foreign country while traveling for business.

In order to explain this chapter in detail, you'll need to know the concepts of encryption and decryption, authentication, key exchange, integrity, and hashing that are not our main targets, so we'll try to avoid mentioning them as much as possible.

We are now in the modern era, and we live in a world where we need condition 2 of Secret.

The basic reason why companies build private networks that are isolated from the outside world is because they have information that they need to keep private and have reasons to protect it (e.g. confidential material).

Naturally, the data I send to my company from a foreign country shouldn't be exposed to anyone.

That's why IPsec is invented to create a virtual private network, giving the effect that you're on a private network  and offers technologies like encryption to ensure that the data is properly encrypted so that it can't be seen and can't be exposed.

Specifically, in order to satisfy Secret #2, the following premises are required

1. authentication: Is the data that arrives at the company really from "me"?
2. Encryption: Is the password (secret key) known only to the company and you, so that no one else can see it while it travels through the internet?
3. Integrity: Has it not been tampered with by anyone while traveling through the internet?

Each of these topics will not be covered in this article.

(If you are curious, I recommend that you Google each of these topics separately, rather than searching for IPsec. There are many different ways to address each topic, and IPsec is just an adaptation and use of those methods.)

### VPN creation process
To create a VPN and access it from the outside, you first need to get an IP address from your company that you will use to access the company's private network while traveling abroad on business.

![image-20240414130454299.png|center round|650](/img/user/kr/%EB%84%A4%ED%8A%B8%EC%9B%8C%ED%81%AC/assets/%EA%B0%80%EB%B3%8D%EA%B2%8C%20%EC%95%8C%EC%95%84%EB%B3%B4%EB%8A%94%20VPN%EC%9D%98%20%EB%B3%B8%EC%A7%88%20-%20(PN%20%EB%B6%80%ED%84%B0,%20IPSEC,%20VPN%EC%9D%B4%20%EC%99%9C%20%EC%95%88%EC%A0%84%ED%95%98%EC%A7%80%20%EC%95%8A%EC%9D%80%EC%A7%80%20%EA%B9%8C%EC%A7%80)/image-20240414130454299.png)
### Tunneling
Now you're traveling to a faraway land (or working from home).

First, let's take a quick look at the process of tunneling, which is how IPsec creates a connection for communication.

Many of the cryptographic concepts mentioned earlier are used to create this tunnel.

The overall flow is as follows

1. authentication
	1. you tell the company that you're Bob
	2. the company verifies that you're really Bob
2. exchange passwords (or keys)
	1. the company and Bob exchange a password (or key) that only both know in order to encrypt and transmit data (packets)

By performing this process, a conduit of communication is created in the network infrastructure for only the company and Bob.

This is called a tunnel.

![image-20240414132141515.png|center round|650](/img/user/kr/%EB%84%A4%ED%8A%B8%EC%9B%8C%ED%81%AC/assets/%EA%B0%80%EB%B3%8D%EA%B2%8C%20%EC%95%8C%EC%95%84%EB%B3%B4%EB%8A%94%20VPN%EC%9D%98%20%EB%B3%B8%EC%A7%88%20-%20(PN%20%EB%B6%80%ED%84%B0,%20IPSEC,%20VPN%EC%9D%B4%20%EC%99%9C%20%EC%95%88%EC%A0%84%ED%95%98%EC%A7%80%20%EC%95%8A%EC%9D%80%EC%A7%80%20%EA%B9%8C%EC%A7%80)/image-20240414132141515.png)
### Packet transfer (data transfer)
Now we have a tunnel, a secret communication path between the company and Bob!

Now, how can we use this tunnel to make Bob act as if he is inside the company's private network?
![image-20240414133025412.png|center round|650](/img/user/kr/%EB%84%A4%ED%8A%B8%EC%9B%8C%ED%81%AC/assets/%EA%B0%80%EB%B3%8D%EA%B2%8C%20%EC%95%8C%EC%95%84%EB%B3%B4%EB%8A%94%20VPN%EC%9D%98%20%EB%B3%B8%EC%A7%88%20-%20(PN%20%EB%B6%80%ED%84%B0,%20IPSEC,%20VPN%EC%9D%B4%20%EC%99%9C%20%EC%95%88%EC%A0%84%ED%95%98%EC%A7%80%20%EC%95%8A%EC%9D%80%EC%A7%80%20%EA%B9%8C%EC%A7%80)/image-20240414133025412.png)

The secret is
1. the company's servers know the IP address Bob was issued before he left for his business trip
2. encapsulate the packets one more time.

In IPsec, encapsulation means that the IP contains two pieces of information: the source and destination information for routing in the external network, and the origin/destination information for use within the private network.

![image-20240414134414994.png|center round|650](/img/user/kr/%EB%84%A4%ED%8A%B8%EC%9B%8C%ED%81%AC/assets/%EA%B0%80%EB%B3%8D%EA%B2%8C%20%EC%95%8C%EC%95%84%EB%B3%B4%EB%8A%94%20VPN%EC%9D%98%20%EB%B3%B8%EC%A7%88%20-%20(PN%20%EB%B6%80%ED%84%B0,%20IPSEC,%20VPN%EC%9D%B4%20%EC%99%9C%20%EC%95%88%EC%A0%84%ED%95%98%EC%A7%80%20%EC%95%8A%EC%9D%80%EC%A7%80%20%EA%B9%8C%EC%A7%80)/image-20240414134414994.png)

This encapsulated packet encrypts the origin/destination/data to be used inside the company with the key shared by the company and Bob, so the only information that the outside world can see is the origin and destination information *on the outside network*.

When the packet arrives at the company, it is decapsulated and decrypted with the previously shared key.

![image-20240414135340932.png|center round|650](/img/user/kr/%EB%84%A4%ED%8A%B8%EC%9B%8C%ED%81%AC/assets/%EA%B0%80%EB%B3%8D%EA%B2%8C%20%EC%95%8C%EC%95%84%EB%B3%B4%EB%8A%94%20VPN%EC%9D%98%20%EB%B3%B8%EC%A7%88%20-%20(PN%20%EB%B6%80%ED%84%B0,%20IPSEC,%20VPN%EC%9D%B4%20%EC%99%9C%20%EC%95%88%EC%A0%84%ED%95%98%EC%A7%80%20%EC%95%8A%EC%9D%80%EC%A7%80%20%EA%B9%8C%EC%A7%80)/image-20240414135340932.png)


If you look closely at the decrypted packet, you can see that it is identical to the packet for the request on the private network.
![image-20240414135446192.png|center round|650](/img/user/kr/%EB%84%A4%ED%8A%B8%EC%9B%8C%ED%81%AC/assets/%EA%B0%80%EB%B3%8D%EA%B2%8C%20%EC%95%8C%EC%95%84%EB%B3%B4%EB%8A%94%20VPN%EC%9D%98%20%EB%B3%B8%EC%A7%88%20-%20(PN%20%EB%B6%80%ED%84%B0,%20IPSEC,%20VPN%EC%9D%B4%20%EC%99%9C%20%EC%95%88%EC%A0%84%ED%95%98%EC%A7%80%20%EC%95%8A%EC%9D%80%EC%A7%80%20%EA%B9%8C%EC%A7%80)/image-20240414135446192.png)

This is how communication works over IPsec.

Of course, you can think of it the same way when communicating with Bob from the inside to the outside.

# Why are VPNs insecure?
First, let me applaud you for reading this far.

Now, let's get to the really final topic: So why are VPNs insecure?

Or, more precisely, why a *VPN service for bypassing* doesn't guarantee *anonymity*.

## VPN services that offer bypassing

In situations like remote work and traveling abroad, VPNs do their job and fulfill most of the requirements.

However, you may have heard more about VPNs with terms like \~\~bypass.

These services claim that they provide complete anonymity and fulfill privacy.

But what privacy and anonymity are they talking about here?

So far, we've covered two different ways to set up a VPN: via route adjustment and via IPsec.

What we need to keep in mind is that

1. you are relying on your ISP or company to deliver the information - i.e. it will go through your ISP
2. no matter what, your IP address is exposed to the outside world

These two points are the center of the debate.
## IP address? ISP?
If we say that we are using a VPN service to achieve anonymity, we can think of ourselves as Bob and the VPN service provider as the "company".

The "company" is the one that intermediates between us and the "external site" we're trying to access.

In the VPNs we've seen so far, we've seen that Bob's and the company's IP addresses are exposed on a network outside of the ISP's service, and that the company that receives Bob's data can decrypt the encrypted data.

Yes, the ISP can see that we're requesting something from the VPN service provider, and the VPN service provider can see what sites we're trying to access and what we're sending and receiving.

Of course, It doesn't mean that the VPN service provider knows everything, but if they try, they can leave a trail of data behind, including logs of the sites and data we've tried to access.

This is why we say that VPN services don't provide complete anonymity.

If you look around, you'll often find VPN providers advertising that they don't keep logs, and that's for this very reason.
# References
1. [What is a VPN?](http://sol.te.net.ua/www/nanog/vpn.pdf)
# See also

1. https://www.youtube.com/watch?v=6w1F6qnPQiE&ab_channel=%EB%84%90%EB%84%90%ED%95%9C%EA%B0%9C%EB%B0%9C%EC%9E%90T
2. https://www.youtube.com/watch?v=15amNny_kKI&t=779s&ab_channel=LearnCantrill에 