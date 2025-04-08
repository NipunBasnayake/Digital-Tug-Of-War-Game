package edu.nipun.kambaadima.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Room {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String name;

    private String teamName;

    private String password;

    private String leaderUserId;

    private Integer currentCount;

    private Integer userCount;

    @ElementCollection
    @CollectionTable(name = "room_user_ids", joinColumns = @JoinColumn(name = "room_id"))
    @Column(name = "user_id")
    @Builder.Default
    private List<String> userIds = new ArrayList<>();

    public boolean isFull() {
        return userIds.size() >= 4;
    }

    public boolean addUser(String userId) {
        if (isFull() || userIds.contains(userId)) {
            return false;
        }
        userIds.add(userId);
        return true;
    }

    public boolean removeUser(String userId) {
        return userIds.remove(userId);
    }

    public boolean isLeader(String userId) {
        return leaderUserId != null && leaderUserId.equals(userId);
    }
}