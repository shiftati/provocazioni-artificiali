import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "./ui/Button";
import { RefreshIcon } from "./icons";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    errorMessage: "",
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || "Errore imprevisto nell'applicazione",
    };
  }

  public override componentDidCatch(_error: Error, _errorInfo: ErrorInfo): void {
    // Error logged to error tracking or state without console.log
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            width: "100vw",
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "var(--color-bg)",
            color: "var(--color-text)",
            padding: "var(--space-8)",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: "2.5rem", marginBottom: "var(--space-4)", color: "var(--color-danger)" }}>
            Qualcosa è andato storto
          </h1>
          <p style={{ fontSize: "1.2rem", color: "var(--color-text-muted)", maxWidth: "600px", marginBottom: "var(--space-8)" }}>
            Si è verificato un problema imprevisto durante l'esecuzione del talk. Puoi ricaricare la schermata senza perdere la configurazione salvata.
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={this.handleReload}
            leftIcon={<RefreshIcon size={22} />}
          >
            Ricarica applicazione
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
