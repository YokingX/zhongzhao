import { School } from "@/types/school";
import { SITE_URL } from "@/lib/site";
import { getLatestScore } from "@/lib/school-utils";

interface SchoolJsonLdProps {
  school: School;
}

export function SchoolJsonLd({ school }: SchoolJsonLdProps) {
  const latest = getLatestScore(school);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: school.name,
    alternateName: school.shortName,
    description: school.description,
    url: `${SITE_URL}/schools/${school.id}`,
    address: school.address
      ? {
          "@type": "PostalAddress",
          addressLocality: school.district,
          streetAddress: school.address,
          addressRegion: "北京市",
          addressCountry: "CN",
        }
      : {
          "@type": "PostalAddress",
          addressLocality: school.district,
          addressRegion: "北京市",
          addressCountry: "CN",
        },
    ...(school.website ? { sameAs: [school.website] } : {}),
    ...(latest
      ? {
          additionalProperty: {
            "@type": "PropertyValue",
            name: `${latest.year}年统招最低分数线`,
            value: String(latest.minScore),
          },
        }
      : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
