import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DayGridView } from "@/components/DayGridView";
import { useAllTrackAContent } from "@/hooks/use-track-a-content";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { TrackAModule, PrelimModuleWithStatus } from "@shared/schema";

export default function MentorProgram() {
  const [_, setLocation] = useLocation();

  const { data: trackASummaries } = useAllTrackAContent();
  const { data: trackAModules } = useQuery<TrackAModule[]>({
    queryKey: ["/api/track-a-modules"],
  });
  const { data: rawPrelimModules } = useQuery<PrelimModuleWithStatus[]>({
    queryKey: ["/api/prelim-modules"],
  });

  // Mentors preview the programme — show all prelim cards as completed so they're accessible
  const prelimModulesData: PrelimModuleWithStatus[] = (rawPrelimModules ?? []).map((m) => ({
    ...m,
    completed: true,
  }));

  const noop = () => {};

  return (
    <DashboardLayout>
      <div className="h-full">
        <DayGridView
          currentDay={30}
          isTrackA={true}
          trackASummaries={trackASummaries}
          trackBSummaries={undefined}
          cohortStartDate={undefined}
          prayerCompletions={[]}
          isDayCompleted={() => false}
          isPeriodCompleted={() => false}
          onDaySelect={(day) => {
            if (day && day > 0) {
              setLocation(`/preview/track-a/${day}`);
            }
          }}
          prelimModulesData={prelimModulesData}
          allPrelimsComplete={true}
          onPrelimSelect={noop}
          onWorkbookSelect={noop}
          week4Ready={true}
        />
      </div>
    </DashboardLayout>
  );
}
