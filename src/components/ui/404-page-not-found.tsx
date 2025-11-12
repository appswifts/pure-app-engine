"use client";

import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Utensils } from "lucide-react";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <section className="bg-white dark:bg-background min-h-screen flex items-center justify-center">
      <div className="container mx-auto px-4">
        <div className="flex justify-center">
          <div className="w-full sm:w-10/12 md:w-8/12 text-center">
            {/* Brand Logo */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-3 text-primary">
                <Utensils className="h-12 w-12" />
                <span className="text-3xl font-bold">QR Menu</span>
              </div>
            </div>

            {/* 404 Lottie Animation */}
            <div className="flex flex-col items-center justify-center my-8" aria-hidden="true">
              <div className="w-[300px] h-[300px] max-w-[90vw]">
                <DotLottieReact
                  src="https://lottie.host/03d2bdbe-8a04-4e25-8b75-d7462d08e00f/TMf6CzHNnc.lottie"
                  loop
                  autoplay
                />
              </div>
              <h1 className="text-center text-black dark:text-white text-6xl sm:text-7xl md:text-8xl font-bold mt-4">
                404
              </h1>
            </div>

            {/* Message */}
            <div className="mt-4">
              <h3 className="text-2xl text-black dark:text-white sm:text-3xl font-bold mb-4">
                Page Not Found
              </h3>
              <p className="mb-6 text-black dark:text-muted-foreground sm:mb-5 text-lg">
                We couldn't find the page you're looking for. It may have been moved or deleted.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
                <Button
                  variant="default"
                  onClick={() => navigate("/")}
                  className="bg-primary-green hover:bg-primary-green/90 text-white"
                >
                  Return to Home
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(-1)}
                >
                  Go Back
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
