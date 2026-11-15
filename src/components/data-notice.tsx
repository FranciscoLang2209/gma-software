import { Callout } from "@radix-ui/themes";
import { getWorkspaceStatus } from "@/lib/data/workspace";

export function DataNotice() {
  const status = getWorkspaceStatus();
  return (
    <Callout.Root
      color={status.kind === "error" ? "red" : "gray"}
      role={status.kind === "error" ? "alert" : "status"}
      className="data-notice"
    >
      <Callout.Text>
        <strong>{status.title}.</strong> {status.description}
      </Callout.Text>
    </Callout.Root>
  );
}
