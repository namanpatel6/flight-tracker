"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Suspense } from "react";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: Record<string, string> = {
    Configuration: "There is a problem with the server configuration.",
    AccessDenied: "You do not have permission to sign in.",
    Verification: "The verification link may have been used or has expired.",
    Default: "An error occurred during authentication.",
    CredentialsSignin: "The email or password you entered is incorrect.",
    OAuthSignin: "Error in OAuth sign in. Please try again.",
    OAuthCallback: "Error in OAuth callback. Please try again.",
    OAuthCreateAccount: "Could not create OAuth account. Please try again.",
    EmailCreateAccount: "Could not create email account. Please try again.",
    Callback: "Error in callback. Please try again.",
    OAuthAccountNotLinked: "This email is already associated with another account.",
    EmailSignin: "Error sending the email. Please try again.",
    SessionRequired: "Please sign in to access this page.",
  };

  const errorMessage = error ? errorMessages[error] || errorMessages.Default : errorMessages.Default;

  return (
    <Card className="mx-auto max-w-md w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Authentication Error</CardTitle>
        <CardDescription>
          There was a problem with your authentication
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {errorMessage}
          </AlertDescription>
        </Alert>
        
        <div className="flex flex-col space-y-2">
          <Button asChild>
            <Link href="/auth/signin">
              Try signing in again
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">
              Return to home
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AuthError() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Suspense fallback={
        <Card className="mx-auto max-w-md w-full">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Loading...</CardTitle>
          </CardHeader>
        </Card>
      }>
        <AuthErrorContent />
      </Suspense>
    </div>
  );
} 