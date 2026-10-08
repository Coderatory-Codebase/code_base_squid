import type { ReactElement } from "react";
import { CircleAlert } from "lucide-react";
import { Button, MessageState } from "@workspace/ui";

type UserProfileErrorStateProps = Readonly<{
  message: string;
  retryable: boolean;
}>;

export const UserProfileErrorState = ({ message, retryable }: UserProfileErrorStateProps): ReactElement => (
  <MessageState
    action={retryable ? (
      <div className="mt-6">
        <Button asChild variant="outline">
          <a href="/identity/user-profile">Retry profile load</a>
        </Button>
      </div>
    ) : undefined}
    description={message}
    eyebrow="Identity"
    icon={<CircleAlert aria-hidden="true" className="size-8 text-muted-foreground" />}
    title="Unable to load your profile"
  />
);
