# Design Vocabulary

Shared terms for `/architect-design`, `/improve-codebase-architecture`, and design-mode `/review`. Use exactly — don't substitute "component," "service," "API," or "boundary."

## Glossary

**Module** — anything with an interface and an implementation (function, class, package, or tier-spanning slice).

**Interface** — everything a caller must know: type signature, invariants, ordering constraints, error modes, required configuration, performance characteristics.

**Implementation** — what's inside a module. Distinct from **Adapter** (role at a seam, not substance).

**Depth** — behaviour a caller can exercise per unit of interface learned. **Deep** = small interface + rich implementation. **Shallow** = interface ≈ implementation (avoid).

**Seam** — where a module's interface lives; where behaviour can be altered without editing in that place.

**Adapter** — concrete thing that satisfies an interface at a seam.

**Leverage** — capability per unit of interface learned. One implementation pays back across N call sites and M tests.

**Locality** — change, bugs, knowledge, and verification concentrate in one place. Fix once, fixed everywhere.

## Principles

- **Depth is a property of the interface**, not the implementation. Internal seams can exist privately; they are not part of the external interface.
- **The deletion test.** Delete the module. Complexity vanishes → pass-through. Complexity reappears across N callers → earning its keep.
- **The interface is the test surface.** Callers and tests cross the same seam.
- **One adapter = hypothetical seam. Two adapters = real seam.** Don't introduce a seam unless something actually varies across it.

## Designing for testability

1. **Accept dependencies, don't create them** — inject gateways, don't `new StripeGateway()` inside.
2. **Return results, don't produce side effects** — prefer `calculateDiscount(cart): Discount` over mutating `cart.total`.
3. **Small surface area** — fewer methods and params → simpler tests.
