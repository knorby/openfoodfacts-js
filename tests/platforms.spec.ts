import { describe, it, expect, vi } from "vitest";
import { getProductImageUrl, OpenFoodFacts } from "../src";
import {
  BackendType,
  BACKEND_DOMAINS,
  BACKEND_NAMES,
  ROBOTOFF_API_URLS,
  getProductImageBaseUrl,
  PRODUCT_IMAGE_BASE_URL,
  PRODUCT_API_HOST,
  DEFAULT_ROBOTOFF_API_URL,
} from "../src/consts";
import { TAXONOMY_URL } from "../src/taxonomy/api";

const BACKENDS = [
  BackendType.OFF,
  BackendType.OBF,
  BackendType.OPFF,
  BackendType.OPF,
] as const;

describe("Platform support tests", () => {
  const dummyFetch = (() => Promise.resolve(new Response())) as typeof fetch;

  it("should set the correct baseUrl for OFF platform", () => {
    const off = new OpenFoodFacts(dummyFetch, {
      type: BackendType.OFF,
    });
    // @ts-ignore - accessing private property for testing
    expect(off.baseUrl).toContain(BACKEND_DOMAINS[BackendType.OFF]);
  });

  it("should set the correct baseUrl for OBF platform", () => {
    const off = new OpenFoodFacts(dummyFetch, {
      type: BackendType.OBF,
    });

    // @ts-ignore - accessing private property for testing
    expect(off.baseUrl).toContain(BACKEND_DOMAINS[BackendType.OBF]);
  });

  it("should set the correct baseUrl for OPFF platform", () => {
    const off = new OpenFoodFacts(dummyFetch, {
      type: BackendType.OPFF,
    });

    // @ts-ignore - accessing private property for testing
    expect(off.baseUrl).toContain(BACKEND_DOMAINS[BackendType.OPFF]);
  });

  it("should set the correct baseUrl for OPF platform", () => {
    const off = new OpenFoodFacts(dummyFetch, {
      type: BackendType.OPF,
    });

    // @ts-ignore - accessing private property for testing
    expect(off.baseUrl).toContain(BACKEND_DOMAINS[BackendType.OPF]);
  });

  it("should set the correct User-Agent header based on platform", () => {
    const backends = [
      BackendType.OFF,
      BackendType.OBF,
      BackendType.OPFF,
      BackendType.OPF,
    ];

    const expectedAgentPrefixes = [
      BACKEND_NAMES[BackendType.OFF],
      BACKEND_NAMES[BackendType.OBF],
      BACKEND_NAMES[BackendType.OPFF],
      BACKEND_NAMES[BackendType.OPF],
    ];

    for (let i = 0; i < backends.length; i++) {
      const off = new OpenFoodFacts(dummyFetch, {
        type: backends[i],
      });

      // @ts-ignore - accessing private property for testing
      expect(off.customUserAgent).toContain(expectedAgentPrefixes[i]);
    }
  });

  it("should accept a custom host", () => {
    const customHost = "https://test.openfoodfacts.org";
    const off = new OpenFoodFacts(dummyFetch, {
      type: BackendType.OFF,
      host: customHost,
    });

    // @ts-ignore - accessing private property for testing
    expect(off.baseUrl).toBe(customHost);
  });

  describe("Flavor-dependent URL matrix", () => {
    it("should build the correct image base URL for every backend", () => {
      for (const backend of BACKENDS) {
        expect(getProductImageBaseUrl(backend)).toBe(
          `https://images.${BACKEND_DOMAINS[backend]}/images/products`,
        );
      }
    });

    it("should build the correct taxonomy URL for every backend", () => {
      for (const backend of BACKENDS) {
        expect(TAXONOMY_URL("brands", backend)).toBe(
          `https://static.${BACKEND_DOMAINS[backend]}/data/taxonomies/brands.json`,
        );
      }
    });

    it("should expose a Robotoff URL for every backend", () => {
      for (const backend of BACKENDS) {
        expect(ROBOTOFF_API_URLS[backend]).toBe(
          `https://robotoff.${BACKEND_DOMAINS[backend]}`,
        );
      }
    });

    it("should keep the legacy OFF constants backward compatible", () => {
      expect(PRODUCT_API_HOST).toBe("https://world.openfoodfacts.org");
      expect(PRODUCT_IMAGE_BASE_URL).toBe(
        getProductImageBaseUrl(BackendType.OFF),
      );
      expect(DEFAULT_ROBOTOFF_API_URL).toBe(
        `${ROBOTOFF_API_URLS[BackendType.OFF]}/api/v1`,
      );
    });

    it("should default getProductImageUrl to OFF (unchanged behavior)", () => {
      const images = { front: { rev: "1" } };
      const url = getProductImageUrl("1234567890123", "front", images);
      expect(url).toBe(
        "https://images.openfoodfacts.org/images/products/123/456/789/0123/front.1.400.jpg",
      );
    });

    it("should build the correct product image URL for every backend", () => {
      const images = { front: { rev: "1" } };
      for (const backend of BACKENDS) {
        const url = getProductImageUrl(
          "1234567890123",
          "front",
          images,
          "400",
          backend,
        );
        expect(url).toBe(
          `https://images.${BACKEND_DOMAINS[backend]}/images/products/123/456/789/0123/front.1.400.jpg`,
        );
      }
    });

    it("should return null for a missing image regardless of backend", () => {
      expect(
        getProductImageUrl(
          "1234567890123",
          "front",
          {},
          "400",
          BackendType.OBF,
        ),
      ).toBeNull();
    });
  });

  describe("Effective backend resolution", () => {
    it("should infer the backend from a flavor host", () => {
      const off = new OpenFoodFacts(dummyFetch, {
        host: "https://world.openbeautyfacts.org",
      });
      // @ts-ignore - accessing private property for testing
      expect(off.effectiveBackend).toBe(BackendType.OBF);
    });

    it("should infer OPF and OPFF from their hosts", () => {
      const opf = new OpenFoodFacts(dummyFetch, {
        host: "https://world.openproductsfacts.org",
      });
      const opff = new OpenFoodFacts(dummyFetch, {
        host: "https://world.openpetfoodfacts.org",
      });
      // @ts-ignore - accessing private property for testing
      expect(opf.effectiveBackend).toBe(BackendType.OPF);
      // @ts-ignore - accessing private property for testing
      expect(opff.effectiveBackend).toBe(BackendType.OPFF);
    });

    it("should fall back to OFF for an unrecognized host", () => {
      const off = new OpenFoodFacts(dummyFetch, {
        host: "https://example.com",
      });
      // @ts-ignore - accessing private property for testing
      expect(off.effectiveBackend).toBe(BackendType.OFF);
    });

    it("should not infer a flavor from a lookalike host", () => {
      const off = new OpenFoodFacts(dummyFetch, {
        host: "https://evil-openbeautyfacts.org.attacker.com",
      });
      // @ts-ignore - accessing private property for testing
      expect(off.effectiveBackend).toBe(BackendType.OFF);
    });

    it("should infer a flavor from a bare host without protocol", () => {
      const off = new OpenFoodFacts(dummyFetch, {
        host: "world.openbeautyfacts.org",
      });
      // @ts-ignore - accessing private property for testing
      expect(off.effectiveBackend).toBe(BackendType.OBF);
    });

    it("should prefer an explicit type over host inference", () => {
      const off = new OpenFoodFacts(dummyFetch, {
        type: BackendType.OPF,
        host: "https://world.openbeautyfacts.org",
      });
      // @ts-ignore - accessing private property for testing
      expect(off.effectiveBackend).toBe(BackendType.OPF);
    });

    it("should use the inferred backend for taxonomy requests", async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({})));
      const off = new OpenFoodFacts(fetchMock as unknown as typeof fetch, {
        host: "https://world.openbeautyfacts.org",
      });

      await off.getTaxo("brands");

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining(
          "static.openbeautyfacts.org/data/taxonomies/brands.json",
        ),
        expect.anything(),
      );
    });

    it("should point Robotoff at the matching flavor domain", () => {
      for (const backend of BACKENDS) {
        const off = new OpenFoodFacts(dummyFetch, { type: backend });
        // @ts-ignore - accessing private property for testing
        expect(off.robotoff.baseUrl).toBe(
          `${ROBOTOFF_API_URLS[backend]}/api/v1`,
        );
      }
    });
  });
});
