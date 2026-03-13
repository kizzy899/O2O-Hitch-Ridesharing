package com.heima.account.testSpring;


import lombok.Data;

public class Course {
    private int cid;
    private String cname;

    public void setCid(int cid) {
        this.cid = cid;
    }

    public void setCname(String cname) {
        this.cname = cname;
    }
}
