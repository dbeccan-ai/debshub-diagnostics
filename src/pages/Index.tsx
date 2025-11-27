import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, DollarSign } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const tests = [
    {
      id: "observation",
      name: "Observation Quiz",
      description: "Test your observation and attention to detail",
      duration: 45,
      price: 0,
      isFree: true,
      features: ["Quick assessment", "Instant feedback", "No payment required"]
    },
    {
      id: "math",
      name: "Math Diagnostic Test",
      description: "Comprehensive mathematics skills assessment",
      duration: 90,
      price: 99,
      priceRange: "$99-$120",
      isFree: false,
      features: ["Detailed analysis", "Tier placement", "Certificate included"]
    },
    {
      id: "ela",
      name: "ELA Diagnostic Test",
      description: "English Language Arts proficiency evaluation",
      duration: 90,
      price: 99,
      priceRange: "$99-$120",
      isFree: false,
      features: ["Reading & writing skills", "Tier placement", "Certificate included"]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-yellow-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#1e3a8a]">DEBs Diagnostic Hub</h1>
          <Button 
            onClick={() => navigate("/auth")} 
            className="bg-[#22c55e] hover:bg-[#16a34a] text-white font-semibold"
          >
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold mb-4 text-[#1e3a8a]">
            DEBs Diagnostic Hub
          </h2>
          <p className="text-2xl mb-3 text-[#1e3a8a] font-medium">
            Fast, accurate academic diagnostics for students and parents.
          </p>
          <p className="text-lg text-[#1e3a8a]/80 italic">
            Powered by D.E.Bs LEARNING ACADEMY – Unlocking Brilliance Through Learning
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-6 pb-16">
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {tests.map((test) => (
            <Card key={test.id} className="flex flex-col bg-white shadow-lg hover:shadow-xl transition-shadow rounded-xl">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between mb-2">
                  <CardTitle className="text-2xl text-[#1e3a8a]">
                    {test.name}
                  </CardTitle>
                  {test.isFree && (
                    <Badge className="bg-[#22c55e] text-white font-semibold">
                      Free
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-[#1e3a8a]/70 text-base">
                  {test.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="flex items-center gap-2 text-[#1e3a8a]">
                  <Clock className="w-5 h-5" />
                  <span className="font-semibold">{test.duration} minutes</span>
                </div>
                {!test.isFree && (
                  <div className="flex items-center gap-2 text-[#1e3a8a]">
                    <DollarSign className="w-5 h-5" />
                    <span className="font-semibold">{"priceRange" in test ? test.priceRange : `$${test.price}`}</span>
                  </div>
                )}
                <div className="pt-2">
                  <ul className="space-y-2">
                    {test.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-[#1e3a8a]/80">
                        <span className="text-[#22c55e] font-bold mt-0.5">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="pt-4">
                <Button 
                  className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-white font-semibold text-lg py-6"
                  onClick={() => navigate("/auth")}
                >
                  Get Started
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <Card className="bg-white shadow-xl rounded-xl border-2 border-[#22c55e]">
          <CardContent className="p-12 text-center">
            <h3 className="text-3xl font-bold mb-4 text-[#1e3a8a]">
              Ready to get started?
            </h3>
            <p className="text-[#1e3a8a]/70 text-lg mb-8">
              Create a free account to access all diagnostic tests
            </p>
            <Button 
              size="lg"
              className="bg-[#22c55e] hover:bg-[#16a34a] text-white font-semibold text-xl px-12 py-6"
              onClick={() => navigate("/auth")}
            >
              Create Free Account
            </Button>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200 py-8">
        <div className="container mx-auto px-6 text-center">
          <p className="text-[#1e3a8a]/60">
            &copy; 2024 D.E.Bs LEARNING ACADEMY. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
