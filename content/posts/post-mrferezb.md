---
title: 如何做出一个吊炸天的科研
description: ''
date: '2026-07-10'
tags: []
---
转眼间在美帝作为[CS系Phd](https://zhida.zhihu.com/search?content_id=277255489&content_type=Article&match_order=1&q=CS%E7%B3%BBPhd&zhida_source=entity)学生的第二年已经结束了，多少也算做出了一些工作，在我无敌Nice无敌专业的神仙导师的指导下，对于科研也终于感觉上道了。（很难想象我在短短的几年之前还是一个对科研这件事情的评价跌破地心，认为学术界都是一帮大忽悠大骗子的人。当然也有可能是我本人已经变成大忽悠的形状了）

总的来说，在我没日没夜薅我的神仙导师的情况下，总算把我对于科研的一些亘古难解的问题给搞清楚了，包括但不限于：

-   为什么看了很多论文仍然想不出idea？
-   为什么做出了[SOTA](https://zhida.zhihu.com/search?content_id=277255489&content_type=Article&match_order=1&q=SOTA&zhida_source=entity)的结果仍被批评缺乏Novelty？
-   为什么我已经发了NeurIPS/[OSDI](https://zhida.zhihu.com/search?content_id=277255489&content_type=Article&match_order=1&q=OSDI&zhida_source=entity)/CVPR我还是感觉自己的论文没有价值？
-   为什么某些领域/会议的论文被批评为实验报告？
-   学术界的[科研能力](https://zhida.zhihu.com/search?content_id=277255489&content_type=Article&match_order=1&q=%E7%A7%91%E7%A0%94%E8%83%BD%E5%8A%9B&zhida_source=entity)已经完全被工业界赶超？
-   科学和工程的边界到底在哪里？
-   [AI](https://zhida.zhihu.com/search?content_id=277255489&content_type=Article&match_order=1&q=AI&zhida_source=entity)时代，科研会不会被[Auto Research](https://zhida.zhihu.com/search?content_id=277255489&content_type=Article&match_order=1&q=Auto+Research&zhida_source=entity)取代？

感觉也勉强算搞清楚了什么样的研究是好的研究，如何做出好的研究。虽然本人目前还是个[小卡拉米](https://zhida.zhihu.com/search?content_id=277255489&content_type=Article&match_order=1&q=%E5%B0%8F%E5%8D%A1%E6%8B%89%E7%B1%B3&zhida_source=entity)，我的导师暂时离[图灵奖](https://zhida.zhihu.com/search?content_id=277255489&content_type=Article&match_order=1&q=%E5%9B%BE%E7%81%B5%E5%A5%96&zhida_source=entity)也有比较巨大的距离。但我自认为已经具备了做出一个吊炸天科研项目的所有前提条件，我迫不及待的与大家分享。如果你也有类似的问题，希望可以给你带来帮助。同时如果有胡说八道之处也欢迎大家狠狠地喷我。

本文全文手打，在AI时代弥足珍贵，走过路过不要错过。

### 1\. 什么是[科研](https://zhida.zhihu.com/search?content_id=277255489&content_type=Article&match_order=7&q=%E7%A7%91%E7%A0%94&zhida_source=entity)

在讨论如何做出名垂青史的科研之前，其实得先讨论一件更根本的事情：什么是科研？

这件事情一度困扰了我许久。这个问题像是房间里的大象。我在参与科研初期的时候大量地搜索，网上的资料汗牛充栋，但却根本没有明确的结果。

网上的科研相关资料包括但不限于如下方面：读[PhD](https://zhida.zhihu.com/search?content_id=277255489&content_type=Article&match_order=1&q=PhD&zhida_source=entity)是否真的值得？如何快速想出idea？如何想出好的idea？如何发表顶会论文？走[学术界](https://zhida.zhihu.com/search?content_id=277255489&content_type=Article&match_order=3&q=%E5%AD%A6%E6%9C%AF%E7%95%8C&zhida_source=entity)路线是不是好的职业选择等等等？

这些资料固然和科研有关，然而却鲜少有人成功定义科研。甚至有许多人对科研呈现一种否定的态度：学术界的科研就是个骗局，这帮子尸位素餐的假科学家早该让位给企业了。

幸好在我牛逼导师的指导下，这两年我终于能够给它一个明确的定义了。

答案其实非常俗套且鸡汤：**拓展人类[知识的边界](https://zhida.zhihu.com/search?content_id=277255489&content_type=Article&match_order=1&q=%E7%9F%A5%E8%AF%86%E7%9A%84%E8%BE%B9%E7%95%8C&zhida_source=entity)。**

读到这里肯定有读者要开骂了：他x的，[劳资](https://zhida.zhihu.com/search?content_id=277255489&content_type=Article&match_order=1&q=%E5%8A%B3%E8%B5%84&zhida_source=entity)已经发了114514篇OSDI/ICML/SIGMOD，科研水平不知道比你高到哪里去了，用你来跟劳资讲这个鸡汤话？

且容我在此卖个关子，待我细细道来。

### 2\. 你[设计的方法](https://zhida.zhihu.com/search?content_id=277255489&content_type=Article&match_order=1&q=%E8%AE%BE%E8%AE%A1%E7%9A%84%E6%96%B9%E6%B3%95&zhida_source=entity)不是你的创新点！问题才是！

我初期对科研的认知可以大概总结成这么几个步骤：

1.  找到一个没解决完的问题
2.  看看别人怎么解决的
3.  找到别人研究的”漏洞”（所谓Research Gap, 研究空白）
4.  设计一个方法填补这个漏洞
5.  恭喜你！你是科学家了！

我相信这是许多人对科研的认知的起点。但是从这里开始，很容易不知不觉掉到一个大坑之中。

这个大坑就是：**科研的重点在于设计的方法。**

产生这样的误会很自然，因为1, 2, 3都是总结别人的活。我唯一做的事情是[设计方法](https://zhida.zhihu.com/search?content_id=277255489&content_type=Article&match_order=1&q=%E8%AE%BE%E8%AE%A1%E6%96%B9%E6%B3%95&zhida_source=entity)，那我的方法自然就是这篇论文的核心。

大概的状况be like：

> 老师说论文要有创新性，那我的方法肯定不能落入俗套，我要自己[设计算法](https://zhida.zhihu.com/search?content_id=277255489&content_type=Article&match_order=1&q=%E8%AE%BE%E8%AE%A1%E7%AE%97%E6%B3%95&zhida_source=entity)，自己设计[系统架构](https://zhida.zhihu.com/search?content_id=277255489&content_type=Article&match_order=1&q=%E7%B3%BB%E7%BB%9F%E6%9E%B6%E6%9E%84&zhida_source=entity)。保证没人见过这个方法！调研最近五年的论文，哈哈哈，果真没有人尝试过我这个方法，创新性稳了！  
>   
> 跑跑实验，哎呀，这个性能怎么还不如[baseline](https://zhida.zhihu.com/search?content_id=277255489&content_type=Article&match_order=1&q=baseline&zhida_source=entity)。我得回去再改改架构/优化优化。如此重复x10。  
> 我的方法终于打败了SOTA，又有创新性又有性能，顶会我来啦。  
>   
> 论文终于中了。他们说我的论文是故事会是什么意思，他们说我的论文是实验报告什么意思，明明我的方法这么新颖，明明我的性能SOTA了，怎么还有人说我没有创新性！

答案很简单：**因为这个研究并没有拓展知识的边界。**

什么是拓展知识的边界呢？浅显一点理解就是：读者在读完你的文章后到底收获了什么？

你确实提出了新方法，确实跑出了很高的分数。但读者读完你的文章后，收获的东西只是：这个哥们提出了一个新方法，他设计了系统A，使用了技术B，得到了SOTA，Cool。

这对于读者来说价值是非常有限的，读者更想知道的其实是**“为什么”**。因为这些”为什么”，才能真的推进人们对问题的理解。

为什么改了系统A可以提高性能？是你们注意到了问题有某个结构性的性质然后刚好技术B能够resolve它？为什么系统A在benchmark A上相对baseline提升了10%，但是在benchmark B上只有5%？这两个benchmark分别代表了问题的哪几种特殊情况？

回答了这些”为什么”，才是切实地推进了领域的进展。对比一下：

-   “我们设计了一个[SOTA方法](https://zhida.zhihu.com/search?content_id=277255489&content_type=Article&match_order=1&q=SOTA%E6%96%B9%E6%B3%95&zhida_source=entity)”
-   “我们发现了问题的如下性质，并且利用这个性质采取了技术B解决，我们发现技术B在解决这个问题上有如下特征和限制，因为条件1下面问题会变成xxxx，导致系统发生变化yyyy从而如此影响性能”

结论从[解空间](https://zhida.zhihu.com/search?content_id=277255489&content_type=Article&match_order=1&q=%E8%A7%A3%E7%A9%BA%E9%97%B4&zhida_source=entity)上的一个单点，变成了对于问题和解空间的一个系统探索结果。哪怕对于这个系统不感兴趣的人，也可以从中获得灵感，利用你们发现的性质去设计更好的方案。

  

空口无凭，我们拿深度学习领域著名的[Batch Normalization](https://zhida.zhihu.com/search?content_id=277255489&content_type=Article&match_order=1&q=Batch+Normalization&zhida_source=entity) (Ioffe & Szegedy, 2015) 作为例子，展示一下好的论文怎么做。

如果你没有读过这篇论文，我可以大概介绍一下它的结构。论文首先定义了问题：训练[深度网络](https://zhida.zhihu.com/search?content_id=277255489&content_type=Article&match_order=1&q=%E6%B7%B1%E5%BA%A6%E7%BD%91%E7%BB%9C&zhida_source=entity)时的困难部分来自”[internal covariate shift](https://zhida.zhihu.com/search?content_id=277255489&content_type=Article&match_order=1&q=internal+covariate+shift&zhida_source=entity)”，即每一层的输入分布在训练过程中不断变化。然后作者展示了方法设计的insight：既然我们用[SGD](https://zhida.zhihu.com/search?content_id=277255489&content_type=Article&match_order=1&q=SGD&zhida_source=entity)作为优化器，根据SGD的公式，给每个batch的[激活值](https://zhida.zhihu.com/search?content_id=277255489&content_type=Article&match_order=1&q=%E6%BF%80%E6%B4%BB%E5%80%BC&zhida_source=entity)加一个normalization操作就可以了。

在提出方法之后，作者通过[数学分析](https://zhida.zhihu.com/search?content_id=277255489&content_type=Article&match_order=1&q=%E6%95%B0%E5%AD%A6%E5%88%86%E6%9E%90&zhida_source=entity)和理论推导，做出了四个claim：

1.  **BN可以加速[深度神经网络](https://zhida.zhihu.com/search?content_id=277255489&content_type=Article&match_order=1&q=%E6%B7%B1%E5%BA%A6%E7%A5%9E%E7%BB%8F%E7%BD%91%E7%BB%9C&zhida_source=entity)的训练**
2.  **BN可以让深度网络在高学习率下依然收敛**
3.  **BN可以稳定每一层输入的分布**
4.  **BN本质上是一种类似于Dropout的[regularization](https://zhida.zhihu.com/search?content_id=277255489&content_type=Article&match_order=1&q=regularization&zhida_source=entity)方法**

其中前两个是关于性能的承诺，毕竟他们提出方法就是为了解决深度[神经网络训练](https://zhida.zhihu.com/search?content_id=277255489&content_type=Article&match_order=1&q=%E7%A5%9E%E7%BB%8F%E7%BD%91%E7%BB%9C%E8%AE%AD%E7%BB%83&zhida_source=entity)困难的问题。而后两个则是关于”为什么”的承诺：BN为什么能加速训练？因为它稳定了分布、提供了regularization。

实验部分他们做了这么几件事：

**实验1**：在[MNIST](https://zhida.zhihu.com/search?content_id=277255489&content_type=Article&match_order=1&q=MNIST&zhida_source=entity)上用BN和对照组分别训练了一个简单网络。观察到 **(1a)** 使用BN后网络的[收敛速度](https://zhida.zhihu.com/search?content_id=277255489&content_type=Article&match_order=1&q=%E6%94%B6%E6%95%9B%E9%80%9F%E5%BA%A6&zhida_source=entity)显著快于对照组；**(1b)** 使用BN后每一层的input distribution明显更加平滑，BN确实让分布变得稳定了。

**实验2**：在ImageNet上使用当时的SOTA Inception网络加上BN，分别采用普通学习率、5倍学习率（BN-x5）和30倍学习率（BN-x30），并且试了去掉Dropout。观察到 **(2a)** 使用BN后，网络在5x和30x学习率上都能稳定收敛；**(2b)** 去掉Dropout只使用BN也不会导致[overfitting](https://zhida.zhihu.com/search?content_id=277255489&content_type=Article&match_order=1&q=overfitting&zhida_source=entity)，准确率并没有下降。

我们可以很清晰地看到evaluation是如何支撑claim的：

-   1a + 2a → BN可以加速深度网络的训练
-   2a → BN可以让深度网络在高学习率下依然收敛
-   1b → BN可以稳定输入的分布
-   2b → BN是一种类似Dropout的regularization方法

这些被empirical results支持的claim让这篇文章的科学贡献坚实且完整。如果我们总结一下BN论文做出的科学贡献，除了提出BN这个算法并证明它好用以外，起码还包括以下几点：

1.  指出[distribution shift](https://zhida.zhihu.com/search?content_id=277255489&content_type=Article&match_order=1&q=distribution+shift&zhida_source=entity)是深度神经网络训练困难的一个原因
2.  BN的加速效果体现在它允许使用更高的学习率
3.  BN本质上是一种regularization

这就是我们说的，好的研究不应该只是解空间上的一个点。BN通过回答”为什么”，对问题进行了系统探索。在之后的日子里可能还会有更多normalization方法出现，但读过这篇论文的读者，在面对深度网络训练困难的问题时就有了新的思考角度：会不会是distribution shift导致的？依据这个原理也许可以设计其他手段解决问题。对于想采用BN的读者，也知道了它的加速效果体现在学习率上，不会两眼一抹黑。而对于研究其他trick的研究者，也可以从regularization的角度去思考问题。

*ps: 如果你细心的话，会发现这里有一个逻辑漏洞：他们虽然验证了BN可以稳定输入的分布，也证明了BN可以帮助收敛，但其实并没有实验证明”稳定输入的分布”是加速网络训练的直接原因。这也催生了三年后另一篇经典论文 How Does Batch Normalization Help Optimization? 的诞生。*

*pps: 另外如果按照这个框架去审视一些其它的高影响力论文，你会发现宇宙起源ResNet和[Attention is All You Need](https://zhida.zhihu.com/search?content_id=277255489&content_type=Article&match_order=1&q=Attention+is+All+You+Need&zhida_source=entity)的evaluation也几乎只报告了性能优势，很少探索问题的空间，也属于“烂论文”的范畴。好的idea和好的科研之间的关系是一个很有趣的话题，但展开来讲就太长了，也许以后再写一篇。*

### 3\. 如何做出吊炸天的科研

在理解什么是完整的科学贡献后，我们就可以讨论更实操的内容了：如何完成这样一个坚实的研究项目？

答案很简单，整个研究项目都应该围绕**”推进对问题的理解”**来进行。所有提出的方法、跑的实验，都应该明确地回答某个未被解决的科学问题。

我的导师教导我：”research is 90% about [problem formulation](https://zhida.zhihu.com/search?content_id=277255489&content_type=Article&match_order=1&q=problem+formulation&zhida_source=entity)”，我深以为然。

科研的第一步是”想idea”，换句话说就是”找问题”，这直接决定了一个科研项目的上限。我相信这也是许多初入科研者最头疼的问题。**其中最容易陷入的坑是这类idea：”以前的人没有研究过这个问题，我们第一个对这个问题提出了解决方案。”**

举一些具体的例子：

> “关于这类攻击检测，目前所有的工作都聚焦于Single Agent的场景，我们第一个在Multi-Agent上实现了SOTA。”  
> “关于这类负载，目前所有的工作都使用[RNN架构](https://zhida.zhihu.com/search?content_id=277255489&content_type=Article&match_order=1&q=RNN%E6%9E%B6%E6%9E%84&zhida_source=entity)，我们第一个使用了[Transformer](https://zhida.zhihu.com/search?content_id=277255489&content_type=Article&match_order=1&q=Transformer&zhida_source=entity)结构，达到了SOTA。”

大量初学者的论文遵从这种风格，比如各种各样的”Deep Learning based xxxx algorithm”。基本的套路就是：这里有一个问题，DL在别的领域展示出了潜力，于是我们第一个把DL apply到了这个问题上得到了SOTA。

这类idea先定义了一个空白，然后想了一个办法填补空白。哪怕你用了很多新模块新架构，也很容易做成解空间上的一个点，也就是我们吐槽的实验报告。读者读完后的收获就是：”哦原来DL在这个条件下可以把点数提高X%。”

这类idea作为起点没有错，任何idea都是从粗糙的直觉迭代到严谨的科学问题的。但问题出现在下一步。大多数人的下一步是直接开始设计方法、调参、跑实验、追SOTA，这也是很多人科研痛苦的根源：把科研理解成one shot的过程，找到空白就着急忙慌赶紧填坑生怕被人抢先，填不出SOTA就抓耳挠腮痛不欲生。

但正确的下一步其实是开始问”为什么”。

还是拿上面的例子来说。当你看到所有工作都聚焦于Single Agent的场景时，下一步的想法不应该是”哇终于发现研究空白，我赶紧做一个multi-agent的检测方法占个坑”。（当然在现实世界中，为了有饭吃有米赚有时候不得不为之。但让我们保持一点理想主义）正确的下一步是开始反问：为什么这些已有的方法不能generalize到multi-agent的场景？是单纯因为没人做过，还是有什么更fundamental的原因？

为了回答这个问题，你需要开始设计实验，跑通已有方法的baseline（注意，是在你设计自己的方法**之前**，而不是设计完之后才找baseline来比SOTA。）去看看这些baseline在multi-agent场景下暴露了哪些不足，这些不足的原因是什么。

在深入dig in它们失败原因的时候，你实际上就在逐渐接近 multi-agent system和single-agent system的根本区别。比如single agent的方法只关注initial input和output，但multi-agent的攻击信号可能出现在agent之间的通信过程中。

一旦你发现了这个fundamental difference，就可以自然地据此开始设计自己的方法。这又会引出一系列新的问题：”multi-agent system通常用什么方法通信？通信中的信号应该如何检测？在什么位置截获通信信号最为合适？”这其中每个问题都对应着一组[系统设计](https://zhida.zhihu.com/search?content_id=277255489&content_type=Article&match_order=1&q=%E7%B3%BB%E7%BB%9F%E8%AE%BE%E8%AE%A1&zhida_source=entity)的空间，而当你逐个回答清楚这些问题的时候，你的方法也会自然而然地浮现。而且它没有任何理由不是SOTA：你确定了一个真正fundamental的问题，充分探索了这个问题的性质，根据这些性质针对性地设计了解决方法。当你的方法是从对问题的理解中自然生长出来的，SOTA是顺理成章的结果，压根就不用抓耳挠腮想[novelty](https://zhida.zhihu.com/search?content_id=277255489&content_type=Article&match_order=1&q=novelty&zhida_source=entity)。

在这种情况下，拥有一个solid的实验部分同样也是顺利成章。Evaluation本质上也是为回答科学问题这个整体目标服务的：我们发现了multi-agent system和single-agent system的本质区别，这个本质区别是真的吗？->看我们实验A证明，我们宣称通过设计A解决了问题A，通过设计B解决了问题B，这些设计真是按我们想的那样work的吗？-> 看我们实验B证明。实验部分飞快的有了明确的验证目标，只需要对着这些验证目标，运用在义务教育初中阶段学到的[控制变量](https://zhida.zhihu.com/search?content_id=277255489&content_type=Article&match_order=1&q=%E6%8E%A7%E5%88%B6%E5%8F%98%E9%87%8F&zhida_source=entity)思想设计相应的实验，就天然得到了一组明确完备的验证章节。如果有额外的空间还可以进一步探索系统在各个方向上的[tradeoff](https://zhida.zhihu.com/search?content_id=277255489&content_type=Article&match_order=1&q=tradeoff&zhida_source=entity)，给出关于这个问题更完善的图景。

而许多科研小卡拉米容易陷入的误区是进入一个非常defensive的mindset（比如两年前的我老人家）：evaluation的唯一目的是证明我们的方法”好”。于是倾尽全力地比各种baseline、找各种[数据集](https://zhida.zhihu.com/search?content_id=277255489&content_type=Article&match_order=1&q=%E6%95%B0%E6%8D%AE%E9%9B%86&zhida_source=entity)，从各个角度变着花地论证自己的方法在任何情况下都无懈可击。这也不是不行，但这类evaluation又会陷回方法中心的窠臼，对推进问题的理解贡献就小得多了。

### 4\. 最终碎碎念环节

行文至此，我希望已经比较完善地描述了一个理想情况下做科研的图景。我希望你读到这里的时候，很多开头提到的让你迷茫的问题都可以得到解答：

-   为什么看了很多论文仍然想不出idea？
-   为什么做出了SOTA的结果仍被批评缺乏Novelty？
-   为什么我已经发了NeurIPS/OSDI/CVPR我还是感觉自己的论文没有价值？
-   为什么某些领域/会议的论文被批评为实验报告？
-   科学和工程的边界到底在哪里？
-   学术界的科研能力已经完全被工业界赶超？
-   AI时代，科研会不会被Auto Research取代？

可能没有讨论清楚的只有后三个了。但其实根据前面的讨论，也有一个笼统的答案了。

如果把科研理解为”设计一个方法解决问题”，那学术界和工业界确实是自寻死路，工业界有着高得多的人才密度、高得多的预算、强大得多的组织能力。但如文中所述，理想的科研本就不应该是”设计方法解决问题”。对一个问题给出一个单点的解法是pure engineering contribution。科研工作者应该永远以问题为中心，所有方法和实验的设计都是为了推进对问题的[结构化](https://zhida.zhihu.com/search?content_id=277255489&content_type=Article&match_order=1&q=%E7%BB%93%E6%9E%84%E5%8C%96&zhida_source=entity)理解。

而关于”学术界烂透了，工业界已经引领科研潮流”这种说法，（我觉得骂的好），是对学术界有益的批评，但骂的点不应该是'学术界做得不如工业界好'，而是'学术界压根就不应该在工业界的赛道上卷'。学术研究者应该跳出和工业界比拼Solution的赛道，step back去推进对问题本身的理解。工业界有自己的问题：[KPI](https://zhida.zhihu.com/search?content_id=277255489&content_type=Article&match_order=1&q=KPI&zhida_source=entity)的压力、研究主题相对受限。学者受政府和科研基金资助，有着比工业界更多的时间和自由度去思考本质的问题，也应该利用好这个优势，和工业界实现互补。对于很多深入工业界才能看到的问题，比如超大型模型推理/超大型[分布式系统](https://zhida.zhihu.com/search?content_id=277255489&content_type=Article&match_order=1&q=%E5%88%86%E5%B8%83%E5%BC%8F%E7%B3%BB%E7%BB%9F&zhida_source=entity)/超大型组织里的真实问题应该积极的通过实习/开会等方式合作。去帮助工业界找到那些价值千金的系统后面的fundamental tradeoff，也是大功德一件。

至于AI会不会取代科研？我觉得答案应该已经比较明显了。AI可以[自动化](https://zhida.zhihu.com/search?content_id=277255489&content_type=Article&match_order=1&q=%E8%87%AA%E5%8A%A8%E5%8C%96&zhida_source=entity)的是设计方法和跑实验，也就是我们说的解空间上的单点。比如刷SOTA刷论文的工作全自动完成几乎已经是[现在完成时](https://zhida.zhihu.com/search?content_id=277255489&content_type=Article&match_order=1&q=%E7%8E%B0%E5%9C%A8%E5%AE%8C%E6%88%90%E6%97%B6&zhida_source=entity)了。但这反而更告诉我们应该做认真的，推进问题理解的科研。而且AI工具反而让做这种理解性的工作变得更容易了。2015年BN论文的时代做一个精心设计的控制实验成本很高。现在有AI coding assistant，以前需要一个月的控制实验一个下午就能跑完。做knowledge contribution的门槛从来没有这么低过。这是一个做吊炸天科研的好时代。

我知道上面说的这些听起来非常理想主义。大家喜欢大数字，某些审稿人喜欢SOTA，喜欢无懈可击的defensive evaluation。受制于毕业要求、评审要求等各种乱七八糟的压力，其实也不常有机会真的沉下心来去探索问题的空间，也只好overfit审稿人的平均意见把论文做到borderline然后赶紧扔出去。

但是如果真的有机会，有幸遇到了一个给你空间自由探索的好老师（比如我的老板可惜他现在有点囊中羞涩就先不推荐你们申请了QwQ），或者恰好过了什么长聘考核可以为所欲为，那不妨试试。

万一我们哪天就成为吊炸天的科学家了呢？

  

————————————————

最后再给自己打个广告

作为一名System PhD Student, （没错我居然是研究Operating System的），我目前的研究方向大量集中于infrastructure for agent。 在思考怎么给agent从系统层提供更好的execution environment和[runtime](https://zhida.zhihu.com/search?content_id=277255489&content_type=Article&match_order=1&q=runtime&zhida_source=entity)，如果你也对这方面感兴趣欢迎欢迎私信联系讨论。
