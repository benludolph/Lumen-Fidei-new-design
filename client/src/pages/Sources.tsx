import { Link } from "wouter";
import { ChevronLeft } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";

const SOURCES = [
  `The approach of the revised Freedom Workbook, including its framing of deliverance as encounter with the Father's love and its work of replacing lies with truth, draws on Sean Tobin, Big God, Little Devil.`,
  `Lumen Fidei draws with gratitude on the healing and deliverance ministry tradition of the Catholic Church, and in particular on the work of Dr. Bob Schuchts and the John Paul II Healing Center (Be Healed, Ave Maria Press, 2014; Healing the Whole Person), whose \u201cseven deadly wounds\u201d and tree-of-sin frameworks inform Days 7\u20138; and Neal Lozano and Heart of the Father Ministries (Unbound: A Practical Guide to Deliverance, Chosen Books, 2010), whose keys of repentance, forgiveness, and renunciation inform Days 13\u201315 and 22.`,
  `The Image of God reflection (Day 3) is based on \u201cEight Themes for Prayer with Scripture\u201d by John Wickham, SJ (Prayer Companions\u2019 Handbook, Ignatian Centre Publications, 1991). Day 19 teaching adapted from My Catholic Life! (mycatholic.life). Patristic quotations (Day 27) as compiled by Catholic Answers from W.\u202fA. Jurgens, The Faith of the Early Fathers (Liturgical Press). The Prayer for Inner Healing (Day 18) is traditional; cf. Bishop Julian Porteous, Manual of Minor Exorcisms.`,
  `Quotations from the Catechism of the Catholic Church \u00a9 Libreria Editrice Vaticana. Used with permission.`,
  `Scripture quotations marked NIV are taken from the Holy Bible, New International Version\u00ae, NIV\u00ae. Copyright \u00a9 1973, 1978, 1984, 2011 by Biblica, Inc.\u2122 Used by permission of Zondervan. All rights reserved worldwide. Scripture texts from the New American Bible, revised edition \u00a9 2010, 1991, 1986, 1970 Confraternity of Christian Doctrine, Washington, D.C. Used with permission. Scripture quotations marked ESV are from the ESV\u00ae Bible, copyright \u00a9 2001 by Crossway. Used by permission. Scripture quotations marked NLT are from the Holy Bible, New Living Translation, copyright \u00a9 1996, 2004, 2015 by Tyndale House Foundation. Used by permission of Tyndale House Publishers. Some quotations are from the Douay-Rheims Bible (public domain).`,
  `This program is a ministry of the Archdiocese of Chicago Spiritual Healing Ministry and is provided free of charge for spiritual formation.`,
];

export default function Sources() {
  return (
    <DashboardLayout>
      <div
        style={{
          minHeight: "100%",
          background: "var(--surface-ground)",
          overflowY: "auto",
        }}
      >
        <PageContainer>
          <div style={{ maxWidth: "640px", margin: "0 auto", padding: "28px 0 80px" }}>

            {/* Breadcrumb */}
            <div style={{ marginBottom: "40px" }}>
              <Link href="/program-overview">
                <span
                  className="type-body-sm"
                  style={{
                    color: "var(--white-50)",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <ChevronLeft size={12} />
                  Program Overview
                </span>
              </Link>
            </div>

            {/* Title */}
            <h1
              className="font-serif"
              style={{
                color: "white",
                fontSize: "clamp(22px, 4vw, 32px)",
                fontWeight: 500,
                lineHeight: 1.15,
                margin: "0 0 10px",
              }}
            >
              Sources &amp; Acknowledgments
            </h1>
            <div
              style={{
                width: "40px",
                height: "1px",
                background: "rgba(210,180,120,0.5)",
                marginBottom: "40px",
              }}
            />

            {/* Body paragraphs */}
            <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
              {SOURCES.map((text, i) => (
                <p
                  key={i}
                  className="type-body-sm"
                  style={{
                    color: "rgba(255,255,255,0.65)",
                    lineHeight: 1.75,
                    margin: 0,
                  }}
                >
                  {text}
                </p>
              ))}
            </div>

          </div>
        </PageContainer>
      </div>
    </DashboardLayout>
  );
}
