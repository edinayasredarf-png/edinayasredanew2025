"use client";
import React from 'react';
import Layout from '../components/Layout';
import HeroSection from '../components/HeroSection';
import SectionFeatures from '../components/SectionFeatures';
import BlueTrustSection from '../components/BlueTrustSection';
import PartnersWall from '../components/PartnersWall';

import SectionPlatformAndServices from '../components/SectionPlatformAndServices';
import SplitStyleCards from '../components/SplitStyleCards';
import SectionBestSolution from '../components/SectionBestSolution';
import SectionInterfaceSlider from '../components/SectionInterfaceSlider';
import SectionPublicPrivate from '../components/SectionPublicPrivate';
import SectionAllObjects from '../components/SectionAllObjects';
import SectionMigration from '../components/SectionMigration';
import SectionQuickStart from '../components/SectionQuickStart';
import HomePosts from '../components/HomePosts';
import HomeNews from '../components/HomeNews';

import SectionExpertise from '../components/SectionExpertise';
import SectionSubscribeChannels from '../components/SectionSubscribeChannels';



export default function HomePage() {
  return (
    <Layout>
      <HeroSection />
			<SectionPlatformAndServices />
			<SplitStyleCards/>
			<BlueTrustSection/>
<PartnersWall/>
      <SectionInterfaceSlider />
      <SectionPublicPrivate />
			<HomeNews />
      <SectionAllObjects />
      <SectionMigration />
      <SectionQuickStart />
      <HomePosts />
      <SectionExpertise />
      <SectionSubscribeChannels />
    </Layout>
  );
}




