import { Timer, Crown, Link2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StartDuelButton } from "@/components/start-duel-button";

export default function WarRoomLobbyPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight">War Room</h1>
        <p className="mt-2 text-muted-foreground">
          Challenge a friend to a live head-to-head coding duel. Share a link, both of you get
          the same random problem, and the clock starts the moment your opponent joins. First to
          mark it solved wins.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-start gap-4">
          <div className="grid w-full gap-3 sm:grid-cols-3">
            <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3">
              <Link2 className="mt-0.5 size-4 shrink-0 text-primary" />
              <div className="text-sm">
                <div className="font-medium">Share a link</div>
                <div className="text-xs text-muted-foreground">Invite anyone to your room</div>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3">
              <Timer className="mt-0.5 size-4 shrink-0 text-primary" />
              <div className="text-sm">
                <div className="font-medium">Shared countdown</div>
                <div className="text-xs text-muted-foreground">Starts when they join</div>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3">
              <Crown className="mt-0.5 size-4 shrink-0 text-primary" />
              <div className="text-sm">
                <div className="font-medium">First to solve wins</div>
                <div className="text-xs text-muted-foreground">Live opponent status</div>
              </div>
            </div>
          </div>

          <StartDuelButton />
        </CardContent>
      </Card>
    </div>
  );
}
