# Research

## Voice of Customer knowledge basis

This is a synthesis of **eight vendor guides and one professional framework**. They are useful practitioner sources, not independent evidence of the commercial claims they make. CUVoC should use their shared operational concepts while treating numerical ROI, retention, and product claims as hypotheses unless independently validated.

### Sources

1. [Zonka Feedback: *What Is Voice of Customer? The Complete Guide*](https://www.zonkafeedback.com/blog/what-is-voice-of-customer)
2. [Pendo: *Voice of the Customer: A Comprehensive Guide*](https://www.pendo.io/es-la/glossary/voice-of-the-customer/)
3. [Zendesk: *Voice of the Customer: How to collect and use this data*](https://www.zendesk.com/blog/analytics-and-data/customer-analytics/amplify-voice-of-customer/)
4. [CustomerGauge: *What Is Voice of the Customer?*](https://customergauge.com/voice-of-customer)
5. [Sprinklr: *What is Voice of the Customer & How it Drives ROI*](https://www.sprinklr.com/blog/voice-of-the-customer/)
6. [Gainsight: *The Essential Guide to Voice of the Customer*](https://www.gainsight.com/essential-guide/voice-of-the-customer/)
7. [Qualtrics: *What is the Voice of the Customer?*](https://www.qualtrics.com/articles/customer-experience/what-is-voice-of-customer/)
8. [Medallia: *How to Conduct a Voice of Customer Analysis*](https://www.medallia.com/blog/how-to-conduct-a-voice-of-customer-analysis-a-step-by-step-guide/)
9. [CXPA: *CXPA CX Framework*](https://cxpaglobal.org/cxpacxframework)

## Repeated concepts: the working definition of VoC

The sources consistently treat VoC as a **continuous organizational system**, rather than a survey, dashboard, or collection of comments. Its purpose is to **understand customer needs, expectations, perceptions, and pain points**, then improve decisions and customer experience.

### 1. Collect a complementary mix of signals

Nearly every guide calls for combining:

- **Solicited feedback:** surveys, interviews, focus groups, in-app prompts.
- **Unsolicited feedback:** support tickets, calls, reviews, social and community discussion.
- **Behavioral or operational signals:** product usage, engagement, churn, response and resolution data.

No source considers a single channel sufficient. Support tickets are therefore legitimate VoC evidence, but only one lens: **they overrepresent customers who encounter enough friction to contact support.**

### 2. Preserve context across the customer journey

Feedback is more useful when tied to **a moment, touchpoint, segment, or behavior**. Common examples are onboarding, product adoption, a support interaction, renewal, and usage decline. This permits questions such as “for whom, where, and when does this issue occur?” rather than only “what is the most frequent complaint?”

### 3. Unify data before interpreting it

The guides repeatedly **warn against siloed feedback**. Combining text with customer and operational context makes it possible to relate a theme to outcomes and distinguish systemic patterns from isolated anecdotes. A unified view does **not** require indiscriminate retention or linking of personal data. It must **respect data minimization and privacy constraints.**

### 4. Convert raw feedback into evidence-backed themes

The shared analysis pattern is **thematic analysis of open text, supplemented by sentiment and quantitative metrics.** Theme frequency alone is insufficient: several guides emphasize prioritizing by impact, trend, or outcome association. CUVoC should therefore retain the ticket IDs and representative messages behind each aggregate finding.

### 5. Make insights actionable and owned

**The most repeated failure mode is analysis without action**. A useful VoC system routes findings to responsible teams, supports prioritization, and checks whether the intended change occurred. “Close the loop” may mean responding to an individual customer, correcting a systemic issue, or both.

### 6. Treat VoC as cross-functional

Support, product, operations, marketing, sales, and leadership affect the customer experience. The recurring implication is that **findings must be understandable to different audiences and tied to decisions they can make.**

### 7. Use metrics as context, not as the product

**NPS, CSAT, CES, retention/churn, effort, usage, and operational metrics** recur across the guides. The useful sequence is: **identify a customer problem, quantify its scale and associations, then decide whether it warrants action**. A theme’s association with churn or low CSAT is not proof that it caused either outcome.

- **Net Promoter Score (NPS):** a loyalty metric based on how likely a customer is to recommend a company, product, or service, usually on a 0 to 10 scale. **The score is the percentage of promoters, respondents scoring 9 or 10, minus the percentage of detractors, respondents scoring 0 through 6.** It reflects relationship-level sentiment, not satisfaction with one interaction.
- **Customer Satisfaction Score (CSAT):** a measure of satisfaction with a specific interaction, product, service, or touchpoint. **Its definition depends on the question and scale used, so CUVoC must report the dataset’s actual values and response coverage rather than assume a universal formula.**
- **Customer Effort Score (CES):** a measure of the perceived ease or difficulty of completing a task, resolving an issue, or obtaining help. **It is usually collected with a survey question and is not interchangeable with response or resolution time.**
- **Retention:** the continued relationship with a customer during a defined observation period. **Its denominator, time window, and qualifying customer population must be stated before calculating a retention rate.**
- **Churn:** the ending, cancellation, or loss of a customer relationship during a defined observation period. **In this assignment’s dataset, `has_churn` means a churn signal exists after the support contact. It does not establish that the ticket or its theme caused churn.**
- **Effort:** the difficulty or ease a customer perceives while trying to accomplish a goal. **In text analysis, it is a model-derived signal inferred from language about friction, confusion, repeated attempts, or burdensome steps.** It is different from CES, which is a directly collected survey metric.
- **Usage:** observed customer behavior in a product or service, such as login frequency, feature adoption, session activity, or order activity. **Usage describes what customers did. It does not by itself explain why they did it.**
- **Operational metrics:** measures of how the company’s service process performed. Relevant examples for CUVoC are first-response time, resolution time, SLA outcome, message count, and reopen count. **They describe service delivery, not the customer’s opinion of it.**

## Particular contributions from each source

### Zonka Feedback

Its most useful framing is the operating loop: **Collect → Unify → Understand → Fix**. It distinguishes customer feedback (raw material) from **VoC (the system that turns it into action)**, and argues for **ranking themes by impact rather than volume**. It also introduces **loop-closure rate** as a health metric: how often flagged issues are actually resolved.

### Pendo

Pendo gives the strongest product-management lens: **behavioral data often says what users do, while VoC helps explain why**. It presents synthesized feedback as an input to the product roadmap and emphasizes distributing it to product stakeholders so it does not disappear into a “black hole of feedback.”

### Zendesk

Zendesk’s distinctive emphasis is organizational buy-in. A support-originated VoC program cannot improve the broader experience without agreement across departments on collection, sharing, and action. It also recommends **tailoring feedback requests to relevant milestones or behavior changes.**

### CustomerGauge

CustomerGauge frames VoC as **Measure → Act → Grow**, with a B2B/account-experience orientation. Its useful addition is **passive VoC: infer possible dissatisfaction from reduced engagement** or other behavior when customers do not respond to surveys. It also presses for linking sentiment to revenue, while that link should be analyzed carefully rather than assumed.

### Sprinklr

Sprinklr explicitly classifies signals as **direct**, **indirect**, and **inferred**, a useful vocabulary for CUVoC. Its key warning is that disconnected tools and data silos delay action and undermine cross-team alignment. It also advocates near-real-time monitoring and predictive analytics for emerging risks.

### Gainsight

Gainsight provides a customer-success lens: **segment feedback by persona or role, trigger listening around meaningful events, and avoid generic mass outreach** that creates survey fatigue. It recommends **centralizing open text alongside metrics, grouping recurring themes, tracking their sentiment over time, and analyzing segments for divergent experiences.**

### Qualtrics

Qualtrics adds the idea that text analytics should consider **sentiment, emotion, and effort, not merely positive/negative polarity**. These are related but different signals:

- **Sentiment is the evaluative direction of a statement**: how positively, negatively, neutrally, or mixed the customer evaluates the experience. It answers: “Is the customer’s expressed view favorable or unfavorable?”
- **Emotion is the specific feeling expressed or implied**, such as frustration, anger, anxiety, disappointment, relief, or delight. It answers: “How does this experience make the customer feel?” A comment can contain more than one emotion, and emotional intensity is separate from whether the statement is positive or negative.
- **Effort is the customer’s perceived ease or difficulty** in completing a task, resolving an issue, or getting a request fulfilled. It answers: “How much friction did the customer encounter?” Repeated contacts, unclear steps, or a difficult process can signal high effort, but elapsed time alone does not define it.

**Together, the signals prevent an important loss of meaning.** A customer can be negative because a delivery was late (sentiment), furious about it (emotion), yet have found resolution easy (effort). Another can be neutral in tone but describe a highly difficult process. CUVoC should not infer these dimensions from a message without retaining the supporting text and presenting them as model-derived signals, not established facts. Its strongest operational point is that action planning needs named owners, deadlines, and cross-functional collaboration.

### Medallia

Medallia frames VoC analysis as a unified view of the customer journey that helps explain **how and why customers make decisions**. It explicitly includes both solicited and unsolicited sources, including support tickets, and gives reporting equal status with strategy, collection, analysis, and action planning.

### CXPA CX Framework

CXPA is not a vendor guide. It provides a professional competency frame. It places VoC under “Customer Insights and Understanding,” alongside qualitative and quantitative research, operational data, root-cause analysis, and predictive analysis. It distinguishes descriptive, perception, and outcome metrics, and stresses **translating data into clear communication and action**.

## Tensions and contradictions

### “All channels” versus a focused starting scope

**Most guides describe omnichannel collection as the ideal**. Pendo explicitly says a program can start small. These are compatible only if treated as different maturity stages: begin with a bounded, high-value source and design the model so other sources can later be added. For CUVoC, **support tickets plus available operational outcomes are an intentional first scope, not a claim to represent the whole customer voice**.

### Analyze before action versus Gainsight’s “Listen → Act → Analyze” order

Most sources describe collection, analysis, then action. Gainsight labels its phases Listen, Act, Analyze, even though its “Act” phase is immediate acknowledgement and recovery while “Analyze” is systemic pattern finding. This is not a substantive conflict: **urgent customer recovery can occur immediately, while portfolio-level prioritization requires analysis first. CUVoC addresses the latter, not individual case management.**

### NPS as the central metric versus context-specific measurement

CustomerGauge strongly centers NPS, especially monetized NPS for B2B. Zonka, Zendesk, Gainsight, Qualtrics, and CXPA present a broader metric mix, with CSAT and CES appropriate for specific touchpoints. **CUVoC should not elevate any unavailable metric to a universal KPI. It should use the outcome signals the dataset actually contains and state their coverage.**

### Implied causality versus observational evidence

Several guides connect VoC to retention, revenue, loyalty, and ROI. Those are plausible business aims, but **this dataset can establish only co-occurrence or association.** For example, a theme can have a higher observed churn rate, but the dataset cannot establish that fixing the theme will cause retention to improve. **CUVoC must label this boundary clearly.**

## Implications for CUVoC

- Model the product as **a decision-support loop: ingest, analyze, prioritize, communicate**. Do not claim to close individual customer loops.
- Treat ticket text as unsolicited feedback and **join it only with the provided, privacy-conscious operational context.**
- **Surface themes with evidence, trend, segment, and outcome associations**, not volume alone.
- **Use clear ownership-oriented language in recommendations**, but do not invent owners or causal claims from this dataset.
- Make **missingness, sample size, time-window limits, and the difference between association and causation visible in the final product.**
