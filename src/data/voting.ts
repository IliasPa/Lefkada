export interface PollOption {
  id: string;
  text: string;
}

export interface Poll {
  id: string;
  title: string;
  options: PollOption[];
  explanation: string;
}

export const pollData: Poll = {
  id: 'poll_1',
  title: 'Should Lefkada build a permanent road bridge?',
  options: [
    { id: 'a', text: 'Yes – a permanent bridge is necessary for development' },
    { id: 'b', text: 'No – the floating bridge is sufficient' },
    { id: 'c', text: 'Undecided – need more information' },
    { id: 'd', text: 'Yes, but only if funded by the EU' },
  ],
  explanation: `**About This Vote**

The question of whether Lefkada should replace its iconic floating bridge with a permanent road bridge has been debated for decades. The current floating bridge, installed in its modern form in the 1980s, connects the island to the Greek mainland and is one of the few such structures remaining in Europe.

**Background**

Lefkada, unlike most Greek islands, is technically a peninsula separated from the mainland by a narrow canal dug by the ancient Corinthians around 640 BC. This unique geography means that a permanent road connection is technically feasible, unlike other Greek islands.

**Arguments For a Permanent Bridge**

Proponents argue that a permanent bridge would:
- Reduce travel delays caused by the current floating bridge's openings for marine traffic
- Support economic development and tourism
- Improve emergency services access
- Reduce maintenance costs over the long term

**Arguments Against**

Critics and conservationists highlight that:
- The floating bridge is part of Lefkada's identity and tourist attraction
- A permanent structure would alter the landscape permanently
- Environmental impact assessments show risks to the lagoon ecosystem
- EU funding would be required given the substantial cost

**How This Vote Works**

This poll is a community consultation tool to gauge public opinion. Results will be compiled and presented to the Municipal Council at the next quarterly session. Votes are anonymous and each registered resident may vote once per active poll.

Your participation helps local representatives understand the will of the community.`,
};
