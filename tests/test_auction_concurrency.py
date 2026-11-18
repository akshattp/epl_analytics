import asyncio
from backend.auction.live_auction_manager import LiveAuctionManager

def test_auction_state_machine_transitions():
    async def run():
        mgr = LiveAuctionManager()
        assert mgr.state == "IDLE"

        # Nominate player
        player = {"id": "EPL-P-001", "name": "Sagar Kapadia"}
        await mgr.nominate_player(player, base_price=12.0)
        assert mgr.state == "BIDDING_ACTIVE"
        assert mgr.current_bid == 12.0
        assert mgr.current_bidder is None

        # Invalid bid (below or equal to current bid)
        success, msg = await mgr.place_bid(1, "Victory Vipers", "Sandeep", 12.0)
        assert not success

        # Valid bid
        success, msg = await mgr.place_bid(1, "Victory Vipers", "Sandeep", 12.5)
        assert success
        assert mgr.current_bid == 12.5
        assert mgr.current_bidder["team_id"] == 1

        # Higher bid from rival
        success, msg = await mgr.place_bid(2, "Exotica Warriors", "Aryan", 13.0)
        assert success
        assert mgr.current_bid == 13.0
        assert mgr.current_bidder["team_id"] == 2

        # Close bidding as SOLD
        result = await mgr.close_bidding("SOLD")
        assert mgr.state == "SOLD"
        assert result["winning_team"]["team_id"] == 2
        assert result["final_price"] == 13.0

        # Bid after close rejected
        success, msg = await mgr.place_bid(3, "The Ultimates", "Anurag", 14.0)
        assert not success

    asyncio.run(run())

def test_simultaneous_bids_serialization():
    async def run():
        mgr = LiveAuctionManager()
        player = {"id": "EPL-P-010", "name": "Aryan Shetty"}
        await mgr.nominate_player(player, base_price=10.0)

        # Simulate 5 rapid simultaneous bids
        tasks = [
            mgr.place_bid(1, "Team 1", "Owner 1", 10.5),
            mgr.place_bid(2, "Team 2", "Owner 2", 11.0),
            mgr.place_bid(3, "Team 3", "Owner 3", 11.5),
            mgr.place_bid(4, "Team 4", "Owner 4", 12.0),
            mgr.place_bid(5, "Team 5", "Owner 5", 12.5),
        ]

        results = await asyncio.gather(*tasks)
        successful_bids = [r for r in results if r[0]]
        assert len(successful_bids) > 0
        assert mgr.current_bid >= 10.5

    asyncio.run(run())
