"use client";
import React from 'react';
import Layout from '../components/Layout';
import HeroSection from '../components/HeroSection';
import SectionFeatures from '../components/SectionFeatures';
import SectionBestSolution from '../components/SectionBestSolution';
import SectionInterfaceSlider from '../components/SectionInterfaceSlider';
import SectionPublicPrivate from '../components/SectionPublicPrivate';
import SectionAllObjects from '../components/SectionAllObjects';
import SectionMigration from '../components/SectionMigration';
import SectionQuickStart from '../components/SectionQuickStart';
import SectionBlog from '../components/SectionBlog';
import SectionExpertise from '../components/SectionExpertise';
import SectionSubscribeChannels from '../components/SectionSubscribeChannels';

export default function HomePage() {
  return (
    <Layout>
      <HeroSection />
      <SectionFeatures />
      <SectionBestSolution />
      <SectionInterfaceSlider />
      <SectionPublicPrivate />
      <SectionAllObjects />
      <SectionMigration />
      <SectionQuickStart />
      <SectionBlog />
      <SectionExpertise />
      <SectionSubscribeChannels />
    </Layout>
  );
}
