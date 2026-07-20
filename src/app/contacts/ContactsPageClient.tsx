"use client";

import React from "react";
import Layout from "@/components/Layout";
import ContactsMethodsSection from "@/components/contacts/ContactsMethodsSection";
import ContactsSocialSection from "@/components/contacts/ContactsSocialSection";
import ContactsOfficeSection from "@/components/contacts/ContactsOfficeSection";
import ContactsRequisitesSection from "@/components/contacts/ContactsRequisitesSection";
import ContactsQuestionsCta from "@/components/contacts/ContactsQuestionsCta";

export default function ContactsPageClient() {
  return (
    <Layout>
      <div className="font-[Raleway] font-medium lining-nums">
        {/* Hero */}
        <section className="page-hero rounded-b-[20px] relative overflow-hidden">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4 md:pt-10 md:pb-6 relative z-10">
            <div className="relative flex flex-col lg:flex-row items-center lg:items-stretch">
              <div className="flex-1 lg:basis-3/5 text-left flex flex-col justify-center z-20">
                <h1 className="font-involve text-[#313131] text-[clamp(2rem,5.5vw,3.4rem)] leading-[1.14] tracking-[0.6px]">
                  Контакты
                </h1>
              </div>
            </div>
          </div>
        </section>

        <ContactsMethodsSection />
        <ContactsSocialSection />
        <ContactsOfficeSection />
        <ContactsRequisitesSection />
        <ContactsQuestionsCta />
      </div>
    </Layout>
  );
}
