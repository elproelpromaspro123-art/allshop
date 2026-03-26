import { beforeEach, describe, expect, it } from "vitest";
import { useCheckoutProfileStore } from "./checkout-profile";

const PROFILE = {
  name: "  Johan Contreras  ",
  email: "JOHAN@MAIL.COM ",
  phone: "3001234567",
  document: "1234567890",
  address: " Calle 123 #45-67 ",
  reference: " Torre 2 apto 503 ",
  city: " Bogota ",
  department: "bogota d.c.",
  zip: "110111",
};

describe("checkout profile store", () => {
  beforeEach(() => {
    useCheckoutProfileStore.setState({ profile: null, hasHydrated: false });
  });

  it("saves and normalizes a meaningful checkout profile", () => {
    useCheckoutProfileStore.getState().saveProfile(PROFILE);

    const profile = useCheckoutProfileStore.getState().profile;
    expect(profile).not.toBeNull();
    expect(profile?.name).toBe("Johan Contreras");
    expect(profile?.email).toBe("johan@mail.com");
    expect(profile?.phone).toBe("300 123 4567");
    expect(profile?.document).toBe("1.234.567.890");
    expect(profile?.department).toBe("Bogota D.C.");
  });

  it("ignores incomplete profiles", () => {
    useCheckoutProfileStore.getState().saveProfile({
      ...PROFILE,
      address: "   ",
    });

    expect(useCheckoutProfileStore.getState().profile).toBeNull();
  });

  it("clears the saved profile", () => {
    useCheckoutProfileStore.getState().saveProfile(PROFILE);
    useCheckoutProfileStore.getState().clearProfile();

    expect(useCheckoutProfileStore.getState().profile).toBeNull();
  });
});
