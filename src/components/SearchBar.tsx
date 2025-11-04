import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { Card } from "@/components/ui/card";

export const SearchBar = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["search-products", searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];

      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name_ar,
          name_en,
          company_name_ar,
          company_name_en,
          image_url,
          product_variants (
            price
          )
        `)
        .eq("is_active", true)
        .or(`name_ar.ilike.%${searchTerm}%,name_en.ilike.%${searchTerm}%,company_name_ar.ilike.%${searchTerm}%,company_name_en.ilike.%${searchTerm}%`)
        .limit(6);

      if (error) throw error;

      return data?.map(product => ({
        ...product,
        minPrice: product.product_variants?.[0]?.price
      })) || [];
    },
    enabled: searchTerm.length >= 2,
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm)}`);
      setShowResults(false);
    }
  };

  const handleProductClick = (productId: string) => {
    navigate(`/products/${productId}`);
    setSearchTerm("");
    setShowResults(false);
  };

  const handleInputChange = (value: string) => {
    setSearchTerm(value);
    setShowResults(value.length >= 2);
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl mx-auto">
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <Input
            type="text"
            placeholder="ابحث عن منتج أو شركة..."
            value={searchTerm}
            onChange={(e) => handleInputChange(e.target.value)}
            className="w-full pr-12 pl-4 py-6 text-base placeholder:text-sm rounded-full border-2 border-primary/20 focus:border-primary transition-colors"
          />
          {searchTerm && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setShowResults(false);
              }}
              className="absolute left-12 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
          <Button
            type="submit"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full"
          >
            <Search className="w-5 h-5" />
          </Button>
        </div>
      </form>

      {showResults && searchTerm.length >= 2 && (
        <Card className="absolute top-full mt-2 w-full z-50 max-h-96 overflow-y-auto shadow-lg">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              جاري البحث...
            </div>
          ) : searchResults && searchResults.length > 0 ? (
            <div className="divide-y">
              {searchResults.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleProductClick(product.id)}
                  className="w-full p-4 hover:bg-accent/50 transition-colors text-right flex items-center gap-4"
                >
                  {product.image_url && (
                    <img
                      src={product.image_url}
                      alt={product.name_ar}
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">
                      {product.name_ar}
                    </p>
                    {product.company_name_ar && (
                      <p className="text-sm text-muted-foreground">
                        {product.company_name_ar}
                      </p>
                    )}
                  </div>
                  {product.minPrice && (
                    <p className="text-primary font-bold">
                      {product.minPrice.toLocaleString()} د.ع
                    </p>
                  )}
                </button>
              ))}
              <button
                onClick={() => {
                  navigate(`/products?search=${encodeURIComponent(searchTerm)}`);
                  setShowResults(false);
                }}
                className="w-full p-3 text-center text-primary hover:bg-accent/50 transition-colors font-medium"
              >
                عرض جميع النتائج
              </button>
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              لا توجد نتائج
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
