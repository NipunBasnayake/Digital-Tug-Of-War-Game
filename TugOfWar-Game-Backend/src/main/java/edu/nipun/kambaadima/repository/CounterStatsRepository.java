package edu.nipun.kambaadima.repository;

import edu.nipun.kambaadima.entity.CounterStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CounterStatsRepository extends JpaRepository<CounterStats, Long> {
    Optional<CounterStats> findByUserId(String userId);
}