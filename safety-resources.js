(function () {
  "use strict";

  window.PRACTICE_VILLAGE_SAFETY_RESOURCE_META = {
    status: "prototype-research-reviewed",
    approval: "JoYi + core-team approval pending",
    reviewedAt: "2026-08-04",
    reviewBy: "2026-11-04",
    coverage: "United States national, Japan national, and global technology-safety guidance"
  };

  window.PRACTICE_VILLAGE_SAFETY_RESOURCES = [
    {
      id: "us-eeoc-charge", jurisdiction: "US", sourceType: "Government", organization: "U.S. Equal Employment Opportunity Commission",
      title: "Explore a workplace discrimination charge", url: "https://www.eeoc.gov/filing-charge-discrimination",
      summary: "Explains the EEOC inquiry, interview, and charge process for discrimination connected to protected characteristics and retaliation.",
      useWhen: "You want an official federal starting point for possible workplace discrimination or retaliation.",
      limits: "Coverage and deadlines depend on the facts, employer, location, and type of claim. Federal employees use a different process.",
      languages: "English; language access is available through EEOC", cost: "Free information and intake", tags: ["workplace", "rights", "retaliation"], reviewedAt: "2026-08-04", reviewBy: "2026-11-04"
    },
    {
      id: "us-nlrb-rights", jurisdiction: "US", sourceType: "Government", organization: "National Labor Relations Board",
      title: "Understand rights to act with coworkers", url: "https://www.nlrb.gov/about-nlrb/rights-we-protect/your-rights/employee-rights",
      summary: "Explains when workers may have federal protection for acting together about pay, safety, or working conditions, with or without a union.",
      useWhen: "The issue affects coworkers, you raised a group concern, or workplace organizing may be involved.",
      limits: "The National Labor Relations Act excludes some workers, including many supervisors, independent contractors, agricultural workers, domestic workers, and government employees.",
      languages: "English; NLRB language-access options vary by office", cost: "Free information and filing", tags: ["workplace", "rights", "retaliation"], reviewedAt: "2026-08-04", reviewBy: "2026-11-04"
    },
    {
      id: "us-lsc-aid", jurisdiction: "US", sourceType: "Independent legal aid", organization: "Legal Services Corporation",
      title: "Find local civil legal aid", url: "https://www.lsc.gov/about-lsc/what-legal-aid/i-need-legal-help",
      summary: "Searches for LSC-funded nonprofit legal-aid organizations in every U.S. state, the District of Columbia, and U.S. territories.",
      useWhen: "You want an independent legal-aid organization to help you understand options or local rules.",
      limits: "Eligibility, subject coverage, and capacity vary. Finding an organization does not guarantee representation.",
      languages: "Varies by local organization", cost: "Free or income-qualified civil legal aid", tags: ["legal-aid", "rights", "independent"], reviewedAt: "2026-08-04", reviewBy: "2026-11-04"
    },
    {
      id: "us-trans-help", jurisdiction: "US", sourceType: "Community legal information", organization: "Transgender Law Center",
      title: "Trans-specific legal information helpdesk", url: "https://transgenderlawcenter.org/get-help/",
      summary: "Provides basic information about U.S. laws and policies affecting transgender people, including employment, housing, health care, immigration, and civil rights.",
      useWhen: "Gender identity or expression is part of the experience and you want an identity-aware starting point.",
      limits: "The helpdesk does not provide individualized legal advice or representation.",
      languages: "English and Spanish entry points", cost: "Free legal information", tags: ["identity-aware", "workplace", "rights", "independent"], reviewedAt: "2026-08-04", reviewBy: "2026-11-04"
    },
    {
      id: "us-dv-hotline", jurisdiction: "US", sourceType: "Community advocacy", organization: "National Domestic Violence Hotline",
      title: "Talk with a domestic-violence advocate", url: "https://www.thehotline.org/get-help/",
      summary: "Offers confidential support, safety planning, and referrals when power, monitoring, isolation, threats, financial control, or coercion are present in an intimate relationship.",
      useWhen: "Something feels controlling or unsafe, even without physical violence or a legal label.",
      limits: "Using a monitored phone or browser can create risk. Consider a safer device before opening or contacting a service.",
      languages: "Phone interpretation available; website includes English and Spanish", cost: "Free", tags: ["safety", "coercive-control", "independent"], reviewedAt: "2026-08-04", reviewBy: "2026-11-04"
    },
    {
      id: "global-tech-safety", jurisdiction: "GLOBAL", sourceType: "Community safety guidance", organization: "NNEDV Safety Net Project",
      title: "Make a technology safety plan", url: "https://www.techsafety.org/resources-survivors/technology-safety-plan",
      summary: "Offers survivor-centered steps for technology-facilitated harassment, monitoring, account access, stalking, and documentation safety.",
      useWhen: "You suspect someone may monitor your phone, accounts, location, vehicle, messages, or browser activity.",
      limits: "Changing settings can alert a person who is monitoring you. Review from a safer device when possible.",
      languages: "English", cost: "Free", tags: ["safety", "digital", "coercive-control", "independent"], reviewedAt: "2026-08-04", reviewBy: "2026-11-04"
    },
    {
      id: "jp-power-harassment", jurisdiction: "JP", sourceType: "Government", organization: "Japan Ministry of Health, Labour and Welfare",
      title: "Understand workplace power harassment", url: "https://www.no-harassment.mhlw.go.jp/foreign_workers/foreign_workers_en/1power/",
      summary: "English guidance describing workplace power harassment, employer prevention duties, consultation systems, and disadvantageous treatment after consultation.",
      useWhen: "You are trying to understand whether workplace conduct may fit Japan’s power-harassment framework.",
      limits: "The page provides general information, not a finding about an individual situation.",
      languages: "English; related materials are available in multiple languages", cost: "Free information", tags: ["workplace", "rights", "retaliation"], reviewedAt: "2026-08-04", reviewBy: "2026-11-04"
    },
    {
      id: "jp-labour-consultation", jurisdiction: "JP", sourceType: "Government", organization: "Japan Ministry of Health, Labour and Welfare",
      title: "Find a Comprehensive Labour Consultation Corner", url: "https://www.mhlw.go.jp/general/seido/chihou/kaiketu/soudan.html",
      summary: "Lists free government consultation counters for dismissal, reassignment, wage reduction, bullying, harassment, sexual orientation, gender identity, and other workplace disputes.",
      useWhen: "You want a local public consultation point before deciding what formal step, if any, to take.",
      limits: "The directory page is primarily in Japanese. Services, hours, and language availability vary by location.",
      languages: "Japanese; the ministry reports multilingual consultation options", cost: "Free; no reservation stated for the general service", tags: ["workplace", "rights", "consultation"], reviewedAt: "2026-08-04", reviewBy: "2026-11-04"
    },
    {
      id: "jp-foreign-worker", jurisdiction: "JP", sourceType: "Government", organization: "Japan Ministry of Health, Labour and Welfare",
      title: "Find labor consultation in your language", url: "https://www.check-roudou.mhlw.go.jp/soudan/foreigner.html",
      summary: "Lists telephone consultation and free hotline options for foreign workers in multiple languages.",
      useWhen: "You work in Japan and language access or immigration-related vulnerability makes workplace support harder to reach.",
      limits: "Languages, phone numbers, days, and hours can change; confirm them on the current ministry page.",
      languages: "Multiple languages, including English and Chinese", cost: "Some consultation lines charge phone fees; listed hotline options are free", tags: ["workplace", "language-access", "migrant", "consultation"], reviewedAt: "2026-08-04", reviewBy: "2026-11-04"
    },
    {
      id: "jp-houterasu", jurisdiction: "JP", sourceType: "Public legal information", organization: "Japan Legal Support Center (Houterasu)",
      title: "Find legal-system and consultation information", url: "https://www.houterasu.or.jp/site/english/informationservices.html",
      summary: "Provides free information about Japan’s legal system and directs people to consultation organizations, bar associations, and other support.",
      useWhen: "You do not know what kind of legal or dispute-resolution help fits and want an independent next doorway.",
      limits: "Information services are different from individualized legal consultation. Eligibility for free legal consultation may vary.",
      languages: "Multilingual information service includes English, Chinese, Korean, Spanish, Portuguese, Vietnamese, Tagalog, Nepali, Thai, and Indonesian", cost: "Information is free; phone charges may apply", tags: ["legal-aid", "rights", "language-access", "independent"], reviewedAt: "2026-08-04", reviewBy: "2026-11-04"
    },
    {
      id: "jp-nijiiro", jurisdiction: "JP", sourceType: "Community advocacy", organization: "Nijiiro Diversity",
      title: "LGBTQ+ workplace context in Japan", url: "https://nijiirodiversity.jp/english/",
      summary: "A Japan-based nonprofit focused on LGBTQ+ discrimination and inclusion in workplaces, government, and law.",
      useWhen: "Sexual orientation, gender identity, or expression is part of the workplace context and you want community-informed information.",
      limits: "This public page describes advocacy and organizational work; it is not presented as an individual legal-help intake service.",
      languages: "English overview; broader site primarily Japanese", cost: "Public information is free", tags: ["identity-aware", "workplace", "independent"], reviewedAt: "2026-08-04", reviewBy: "2026-11-04"
    }
  ];
})();
