export const SAMPLE_MD = `# Maritime Trade in the 17th Century

Dr. Alistair Finch argues that Bristol's maritime networks reshaped Atlantic economies. As noted by [@Finch2023], merchants coordinated flows of capital, commodities, and information across ports.

## Background
The longue durée perspective frames trade as a system of structures rather than isolated events.  This view emphasizes how shipping routes, credit instruments, and port institutions evolved together.

## Chapter 1 — Bristol and the Atlantic
Bristol's ship registries reveal dense ties to Ireland, the Iberian Peninsula, and the Americas. Surviving manifests show iterative risk-sharing arrangements among syndicates.

### Method
This manuscript uses primary customs ledgers and port books, cross-checked with secondary sources. Tables and figures are omitted in this short sample.

## Conclusion
Early-modern trade networks laid foundations for global capitalism [@Braudel1982].

# References
`;

export const FICTION_SAMPLE_MD = `# The Lantern Keeper

## Chapter 1 — The Lighthouse

The storm had been building since noon, and by dusk the sea was a wall of gray noise against the rocks below.

Marguerite climbed the spiral stairs for the third time that evening, her hand trailing the cold iron railing. The lantern room smelled of kerosene and salt. She checked the wick, adjusted the reflector, and watched the beam sweep across the water in its slow, dependable arc.

Her father had kept this light for thirty-one years before her. He had taught her to read the weather by the color of the horizon and the behavior of gulls. "When the terns fly inland," he would say, "you have three hours."

The terns had flown inland before breakfast.

---

She was halfway through her logbook entry when she heard the sound — not the wind, not the waves, but something underneath both. A low, rhythmic thumping. Wood against rock.

Marguerite took the lantern from its hook and descended to the gallery. The beam lit nothing but spray and darkness. But the sound continued.

She pulled on her oilskin and went down to the landing. The stairs were slick with spray, each step a negotiation with the wind. At the bottom, wedged between two boulders, she found what the sea had brought her: a rowing boat, half-swamped, with a man lying face-down across the thwarts.

## Chapter 2 — The Stranger

He did not wake for two days.

Marguerite dragged him to the keeper's cottage by his collar, which took the better part of an hour. She built up the fire, stripped his wet clothes, and wrapped him in her father's old wool blankets. His breathing was shallow but steady. A gash above his left ear had stopped bleeding on its own.

She found nothing in his pockets except a brass compass with no needle and a folded letter so waterlogged that the ink had bled into blue clouds.

On the second morning he opened his eyes. They were gray — the same gray as the sea that had delivered him.

"Where am I?" he asked.

"Cap-de-la-Hague," she said. "The lighthouse."

He looked at her for a long moment, then closed his eyes again.

"I was afraid of that," he said.
`;

export const SAMPLES = [
  { key: 'academic', label: 'Academic', title: 'Maritime Trade in the 17th Century', md: SAMPLE_MD, template: 'chicago' as const },
  { key: 'fiction', label: 'Fiction', title: 'The Lantern Keeper', md: FICTION_SAMPLE_MD, template: 'paperback' as const },
];
